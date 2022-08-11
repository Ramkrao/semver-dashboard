# Data Extractor

## Data Extractor Bash Script
This script extracts raw pipeline/DAG related data from previous month run. Usage

```
bash data_extactor.bash -d <start_date>
example: bash data_extactor.bash -d 2022-05-01
```

# Data Fields
This scripts extracts below fields from various systems:

### DTaaS
|job_id|creation_time|state_time|name|state|
|------|-------------|----------|----|-----|
|Dataflow Job ID|Job creation time in the format ```%Y-%m-%d %H:%M:%S```|Job's first state start time in the format ```%Y-%m-%d %H:%M:%S```|Dataflow Job name|Job Final state|

### File Landing

|size|creation_time|file_path|
|------|-------------|----------|
|File size in Bytes|File creation time in the format ```%Y-%m-%dT%H:%M:%SZ```|Complete file path in the GS Bucket|

### BIF

|dag_id|job_id|execution_date|state_time|state|
|------|-------------|----------|----|-----|
|Airflow DAG ID|Aiflow Job ID for the DAG|Job creation time in the format ```%Y-%m-%d %H:%M:%S%z```|Job final task's end time in the format ```%Y-%m-%d %H:%M:%S%z```|Task final state|

# Data Extractor Logic

Data extractor is made up of 2 different script files and 1 JSON template file:

### Data Extractor Bash Script
    Usage: bash data_extactor.bash -d <start_date>

    1. Fetch the values from CLI
    2. Check to make sure the params are supplied

    3. Extract DTaaS Data
      3.1 First login using gcloud
      3.2 Set the project to DTaaS PROD
      3.3 Fetch the DTaaS job details for the past month

    4. Extract BIF Data
      4.1 Get the list of dags
      4.2 get the list of dag_id's
      4.3 iterate through the dag_ids and find all the execution date
      4.5 iterate through each of the execution dates and get the end time for the dag

    5. Extract File Landing data
      5.1. Set the project to DGCP PROD
      5.2. run the gsutil utility to get the raw data
      5.3. filter out folders and summary lines

    6. Cleanup

    7. Run python data extractor
      7.1. extract hourly average data from BIF data
      7.2. extract hourly average data from DTaaS data
      7.3. extract hourly average file size data from File Landing data
      7.4. finally create the system_stats json file for the react app to use

### Data Extractor Python Script

    Usage : data_extractor.py -i <input_file> -c <column_name> -s <system_name>

    1. Extract vales from the CLI
    2. Set the date format based on the supplied system
    3. Format the date for the key
    4. By default capture start_date hour stats
    5. Flatten the dict to list for grouping on hours
    6. Final pass to average out the count based on number of days


### JSON Template

    1. dtaas
      1.1. peak_hour_start                      # DTaaS system's peak hour start based on extracted data
      1.2. peak_hour_end                        # DTaaS system's peak hour end based on extracted data
      1.3. max_limit_per_hour                   # DTaaS system's max job limit/hour based on extracted data

    2. bif
      2.1. peak_hour_start                      # BIF system's peak hour start based on extracted data
      2.2. peak_hour_end                        # BIF system's peak hour end based on extracted data
      2.3. max_limit_per_hour                   # BIF system's max job limit/hour based on extracted data


    3. sobih
      3.1. max_limit_overall                    # SoBIH system's max number of jobs/day

    4. adp
      4.1 total_capacity_tps                    # ADP system's overall capacity/second
      4.2. average_throughput_tps               # ADP system's average transformations based on test data

    5. interconnect
      5.1. peak_hour_start                      # Interconnect system's peak hour start based on extracted data
      5.2. peak_hour_end                        # Interconnect system's peak hour end based on extracted data
      5.3. max_bytes_per_hour                   # Interconnect system's average Bytes/hour based on extracted data

    6. default
      6.1. file_count                           # Default values based on the base value of file count
      6.2. avg_file_size_in_mbs                 # Default average file size in MB
      6.3. avg_number_of_sensitive_fileds       # Default average number of sensitive fields
      6.4. avg_number_of_adp_transformations    # Default average number of ADP transformations
