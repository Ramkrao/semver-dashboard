#!/bin/bash

# Usage guide
var_usage() {
    printf "\n[Data Extractor] Missing Parameter(s): Expecting following list of parameters required"
    printf "\n[Data Extractor]   -s START_DATE in format <YYYY-MM-DD>"
    printf "\n[Data Extractor]   -e END_DATE in format <YYYY-MM-DD>"
    printf "\n[Data Extractor]   Usage: <bif.bash -s 2022-05-01 -e 2022-05-31>"
    printf "\n[Data Extractor]   Note: START_DATE should be earlier than END_DATE"
    exit -1
}

# Fetch the values from CLI
while getopts s:e: flag
do
    case "${flag}" in
        s) start_date=${OPTARG:?"$(var_usage)"};;
        e) end_date=${OPTARG:?"$(var_usage)"};;
    esac
done
# Check to make sure the params are supplied
if [[ -z $start_date || -z $end_date ]]; then
    var_usage
fi
# make sure start date is older than the end date
if [[ "$start_date" > "$end_date" ]];
then
    var_usage
fi

# put current date as yyyy-mm-dd in $date
date=$(date '+%Y-%m-%d')

#################################################################################
#
# 1. Extract DTaaS Data
#
#################################################################################

# 1.1 First login using gcloud
gcloud auth login

# 1.2 Set the project to DTaaS PROD
gcloud config set project anz-data-dtaas-prd-58540e

# 1.3 Fetch the DTaaS job details for the past month
gcloud dataflow jobs list --region australia-southeast1 --limit=5000 --status=terminated  --created-after=${start_date} --created-before=${end_date} --format="csv(id,creationTime,stateTime,name,state)" > dtaas_jobs_$start_date.csv

#################################################################################
#
# 2. Extract BIF Data
#
#################################################################################

read -p 'BIF Username: ' user
read -sp 'BIF Password: ' pass

# 2.1 Get the list of dags
curl -k -s --user "$user:$pass" https://airflow-batch.dgcp-prd.data.gcp.anz/api/experimental/latest_runs > bif_dags.json

# 2.2 get the list of dag_id's
cat bif_dags.json | jq --raw-output '.items[] .dag_id' > dag_ids.txt
# CSV headers
echo "dag_id,job_id,execution_date,end_date,state" > bif_jobs_$start_date.csv

# 2.3 iterate through the dag_ids and find all the execution date
while read line; do
    printf "\n[Data Extractor]   Fetching data for DAG :: $line"
    # check if the DAG had already been processed
    count=`grep $line bif_jobs_$start_date.csv | wc -l | xargs`
    if [[ $count == 0 ]];
    then
        curl -k -s --user "$user:$pass" https://airflow-batch.dgcp-prd.data.gcp.anz/api/experimental/dags/$line/dag_runs |\
         jq --raw-output '.[]| (.execution_date)' > execution_date.txt

        # 2.4 set task based on the DAG
        case $line in
            twistlock_log_dag)
                task="twistlock_log_dag"
                ;;
            SLA_moneythor_reclamation)
                task="check_gcs_files"
                ;;
            pubsub_trigger_batch_ingestion_dag)
                task="pubsub_trigger_batch_ingestion_dag"
                ;;
            meta-db-prd-7d463e_sql_backup_dag | meta-db-prd-ae8ccc_sql_backup_dag | mib-db-prd-ce90f2_sql_backup_dag | moneythor-db-prd-35168b_sql_backup_dag)
                task="delete_obsolete_db_backups"
                ;;
            export_sql_dgcp)
                task="enc_sql_export_meta-db_airflow_replica-1"
                ;;
            export_sql_delete_dgcp)
                task="delete_export_files_airflow"
                ;;
            export_sql_cde_sing)
                task="enc_sql_export_moneythor-db_postgres_replica-1"
                ;;
            export_sql_delete_cde_sing)
                task="delete_export_files_moneythor"
                ;;
            *)
                task="mark_failed_on_upstream_failure"
                ;;
        esac
        
        # 2.5 iterate through each of the execution dates and get the end time for the dag
        while read execution_date; do 
            if [[ ${execution_date:0:10} > $start_date && ${execution_date:0:10} < $end_date ]];
            then
                curl -k -s --user "$user:$pass" https://airflow-batch.dgcp-prd.data.gcp.anz/api/experimental/dags/$line/dag_runs/$execution_date/tasks/$task |\
                jq --raw-output '"\(.dag_id),\(.job_id),\(.execution_date),\(.end_date),\(.state)"' >> bif_jobs_$start_date.csv
            fi
        done < execution_date.txt
    fi
done < dag_ids.txt

#################################################################################
#
# 3. Extract File Landing data
#
#################################################################################

# Set the project to DGCP PROD
gcloud config set project anz-data-dgcp-prd-6443dd

# run the gsutil utility to get the raw data
gsutil ls -lR gs://anz-data-prd1-dgcp-ops-aus-landing/data/bih > file_landing.txt

echo "size,creation_time,file_path" > file_landing_$start_date.csv
while read line; do
  count=`echo $line | cut -d ' ' -f 1-3 | wc -w | xargs`
  # filter out folders and summary lines
  if [[ $line == *csv && $count == 3 ]]; then
    # convert the line to an array
    IFS=' ' read -r -a values <<< "$line"
    # filter values based on the timerange
    if [[ ${values[1]:0:10} > $start_date && ${values[1]:0:10} < $end_date ]]; then
        echo "${values[0]},${values[1]},${values[2]}" >> file_landing_$start_date.csv
    fi
  fi
done < file_landing.txt

#################################################################################
#
# 4. Cleanup
#
#################################################################################

rm dag_ids.txt execution_date.txt bif_dags.json file_landing.txt

#################################################################################
#
# 5. Run python data extractor
#
#################################################################################

# extract hourly average data from BIF data
bif_output=`python3 data_extractor.py -i bif_jobs_$start_date.csv -c execution_date -s BIF`

# extract hourly average data from DTaaS data
dtaas_output=`python3 data_extractor.py -i dtaas_jobs_$start_date.csv -c creation_time -s DTAAS`

# extract hourly average file size data from File Landing data
file_landing_output=`python3 data_extractor.py -i file_landing_$start_date.csv -c creation_time -s FILE_LANDING`

# finally create the system_stats json file for the react app to use
# multi-line syntax doesn't seem to work with jq
cat template.json | jq ".bif += {"hourly_stats": $bif_output}" | jq ".dtaas += {"hourly_stats": $dtaas_output}" | jq ".interconnect += {"hourly_stats": $file_landing_output}" > ../src/config/system_stats.json
