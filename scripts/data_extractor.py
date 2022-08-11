import csv
from datetime import datetime, timezone
import json
import sys, getopt

def utc_to_aest(utc_dt):
    return utc_dt.replace(tzinfo=timezone.utc).astimezone(tz=None)

def main(argv):
  input_file = ""
  column_name = ""
  system_name = ""
  try:
    opts, args = getopt.getopt(argv,"h:i:c:s:")
  except getopt.GetoptError:
    print("data_extractor.py -i <input_file> -c <column_name> -s <system_name>")
    sys.exit(2)
  for opt, arg in opts:
    if opt == "-h":
      print("data_extractor.py -i <input_file> -c <column_name> -s <system_name>")
      sys.exit()
    elif opt == "-i":
      input_file = arg
    elif opt == "-c":
      column_name = arg
    elif opt == "-s":
      system_name = arg

  # Different format dates for different systems
  date_format = ""
  if system_name == "BIF":
    date_format = "%Y-%m-%d %H:%M:%S%z"
  elif system_name == "DTAAS":
    date_format = "%Y-%m-%d %H:%M:%S"
  elif system_name == "FILE_LANDING":
    date_format = "%Y-%m-%dT%H:%M:%SZ"

  bif_stats = {}
  with open(input_file, "r", newline="") as csvfile:
    bifreader = csv.DictReader(csvfile)
    for row in bifreader:
      try:
        start_date = utc_to_aest(datetime.strptime(row[column_name], date_format))
      except ValueError:
        print("Excpection while parsing date {0} with format {1}".format(row[column_name], date_format))
        sys.exit(-1)
      
      # format the date for the key
      formattedStartDate = start_date.strftime("%Y-%m-%d")

      # By default capture start_date hour stats
      if formattedStartDate not in bif_stats:
        bif_stats[formattedStartDate] = {start_date.hour: {"hour_count": 1}}
      else:
        if start_date.hour not in bif_stats[formattedStartDate]:
          bif_stats[formattedStartDate][start_date.hour] = {"hour_count": 1}
        else:
          bif_stats[formattedStartDate][start_date.hour]["hour_count"] += 1
      # if the size column is present, add it to the json object
      if "size" in row:
        if "size" not in bif_stats[formattedStartDate][start_date.hour]:
          bif_stats[formattedStartDate][start_date.hour]["size"] = int(row["size"])
        else:
          bif_stats[formattedStartDate][start_date.hour]["size"] += int(row["size"])
      else:
        bif_stats[formattedStartDate][start_date.hour]["size"] = 0

  # flatten the dict to list for grouping on hours
  hourly_stats = {}
  for date in bif_stats:
    for hour in bif_stats[date]:
      if hour not in hourly_stats:
        hourly_stats[hour] = {
          "value": bif_stats[date][hour]["hour_count"],
          "count": 1,
          "size": int(bif_stats[date][hour]["size"])
          }
      else:
        hourly_stats[hour] = {
          "value": hourly_stats[hour]["value"] + bif_stats[date][hour]["hour_count"],
          "count": hourly_stats[hour]["count"] + 1,
          "size": hourly_stats[hour]["size"] + bif_stats[date][hour]["size"]
          }

  # final pass to average out the count based on number of days
  final_stats = []
  for hour in hourly_stats:
    if "size" in hourly_stats[hour]:
      final_stats.append({
        "hour": hour,
        "count": round(hourly_stats[hour]["value"]/hourly_stats[hour]["count"]),
        "size": round(hourly_stats[hour]["size"]/hourly_stats[hour]["count"])
        })
    else:
      final_stats.append({
        "hour": hour,
        "count": round(hourly_stats[hour]["value"]/hourly_stats[hour]["count"])
        })

  final_stats = sorted(final_stats, key=lambda d:d["hour"])
  print(json.dumps(final_stats))

if __name__ == "__main__":
   main(sys.argv[1:])
