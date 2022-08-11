import stats from './config/system_stats.json'
import {SYSTEMS, SYSTEM_LABELS} from './Constants'

function BuildEstimatesByTimeperiod(estimateArr) {
  // check and fill-in with default values for empty fields
  replaceEmptyFieldsWithDefaults(estimateArr)

  let inputTimeperiods = estimateArr.map(m => {return parseInt(m['timeframe'])}).sort((a,b) => a - b)
  let estimates = []
  inputTimeperiods.forEach(p => {
    let obj = {
      "key": p + " months",
      "value": SYSTEMS.map((s,i) => {
        let sysObj = {
          "key": s,
          "value": computeCapacityIncrease(estimateArr, p, s),
          "label": SYSTEM_LABELS[i]
        }
        return sysObj
        })
      }
    estimates.push(obj)
  })
  return estimates
}

function replaceEmptyFieldsWithDefaults(estimateArr) {
  // get the defaults from config
  let { avg_file_size_in_mbs, avg_number_of_adp_transformations } = stats.default
  estimateArr.forEach(e => {
    if (e.fileSize.length === 0 && e.numFiles > 0)
      e.fileSize = e.numFiles * avg_file_size_in_mbs
    if (e.numTransforms.length === 0 && e.numFiles > 0)
      e.numTransforms = e.numFiles * avg_number_of_adp_transformations
  })
}

// Adapter method to invoke approprite system functions with required params
function computeCapacityIncrease(estimateArr, period, sys) {
  let timeperiod = []
  // for '3 month' estimates filter only rows with `3 months` timeperiod
  if (period === 3)
    timeperiod.push('3')
  // for '6 month' estimates filter both `3 and 6 months` timeperiod
  else if (period === 6)
    timeperiod.push('3', '6')
  // for `12 month` estimates include everything
  else
    timeperiod.push('3', '6', '12')

  switch (sys) {
    // SoBIH
    case SYSTEMS[0]:
      let totFiles = estimateArr.filter(v => timeperiod.indexOf(v.timeframe) !== -1).reduce((a,b) => a + b.numFiles, 0)
      return computeSobihCapacity(totFiles)
    // Interconnect
    case SYSTEMS[1]:
      return computeInterconnectCapacity(
        estimateArr.filter(v => (timeperiod.indexOf(v.timeframe) !== -1 && v.loadWindow === 'Peak')).reduce((a,b) => a + b.fileSize, 0),
        estimateArr.filter(v => (timeperiod.indexOf(v.timeframe) !== -1 && v.loadWindow !== 'Peak')).reduce((a,b) => a + b.fileSize, 0))
    // DTaaS
    case SYSTEMS[2]:
      return computeDtaasCapacity(
        estimateArr.filter(v => (timeperiod.indexOf(v.timeframe) !== -1 && v.loadWindow === 'Peak')).reduce((a,b) => a + b.numFiles, 0),
        estimateArr.filter(v => (timeperiod.indexOf(v.timeframe) !== -1 && v.loadWindow !== 'Peak')).reduce((a,b) => a + b.numFiles, 0))
    // ADP
    case SYSTEMS[3]:
      return computeAdpCapacity(
        estimateArr.filter(v => timeperiod.indexOf(v.timeframe) !== -1).reduce((a,b) => a + b.numTransforms, 0))
    // BIF
    case SYSTEMS[4]:
      return computeBIFCapacity(
        estimateArr.filter(v => (timeperiod.indexOf(v.timeframe) !== -1 && v.loadWindow === 'Peak')).reduce((a,b) => a + b.numFiles, 0),
        estimateArr.filter(v => (timeperiod.indexOf(v.timeframe) !== -1 && v.loadWindow !== 'Peak')).reduce((a,b) => a + b.numFiles, 0))
    default:
      return 0
  }
}

//
// Formula used:          Number of Files
//                 --------------------------------
//                 Average files processed per hour
//              -------------------------------------- * 100
//                   Max Limit of files per hour
//
function computeBIFCapacity (peakfiles, offpeakfiles) {
  let {peak_hour_start, peak_hour_end, max_limit_per_hour, hourly_stats} = stats.bif
  let peakIncrease = 0, offPeakIncrease = 0
  // let's comupte the average files processed per hour for the selected time period
  if (peakfiles > 0) {
    let valueArr = hourly_stats.filter(v => v.hour >= peak_hour_start && v.hour <= peak_hour_end)
    let avgPerHour = valueArr.reduce((a,b) => a + b.count, 0) / valueArr.length;
    peakIncrease = Math.round((((peakfiles/avgPerHour)/max_limit_per_hour)*100) *100) / 100
  }
  if (offpeakfiles > 0) {
    let valueArr = hourly_stats.filter(v => v.hour < peak_hour_start || v.hour > peak_hour_end)
    let avgPerHour = valueArr.reduce((a,b) => a + b.count, 0) / valueArr.length;
    offPeakIncrease = Math.round((((offpeakfiles/avgPerHour)/max_limit_per_hour)*100) *100) / 100
  }
  // now let's compute the increase
  let totIncrease = parseFloat((peakIncrease + offPeakIncrease).toFixed(2))
  return totIncrease
}

//
// Formula used:          Number of Files
//                 --------------------------------
//                 Average files processed per hour
//              -------------------------------------- * 100
//                   Max Limit of files per hour
//
function computeDtaasCapacity (peakfiles, offpeakfiles) {
  let {peak_hour_start, peak_hour_end, max_limit_per_hour, hourly_stats} = stats.dtaas
  let peakIncrease = 0, offPeakIncrease = 0
  // let's comupte the average files processed per hour for the selected time period
  if (peakfiles > 0) {
    let valueArr = hourly_stats.filter(v => v.hour >= peak_hour_start && v.hour <= peak_hour_end)
    let avgPerHour = valueArr.reduce((a,b) => a + b.count, 0) / valueArr.length;
    peakIncrease = Math.round((((peakfiles/avgPerHour)/max_limit_per_hour)*100) *100) / 100
  }
  if (offpeakfiles > 0) {
    let valueArr = hourly_stats.filter(v => v.hour < peak_hour_start || v.hour > peak_hour_end)
    let avgPerHour = valueArr.reduce((a,b) => a + b.count, 0) / valueArr.length;
    offPeakIncrease = Math.round((((offpeakfiles/avgPerHour)/max_limit_per_hour)*100) *100) / 100
  }
  // now let's compute the increase
  let totIncrease = parseFloat((peakIncrease + offPeakIncrease).toFixed(2))
  return totIncrease
}

//
// Formula used:        Total Number of Files
//              -------------------------------------- * 100
//                   Max Limit of files per day
//
function computeSobihCapacity (totalFiles) {
  let {max_limit_overall} = stats.sobih
  return Math.round(((totalFiles/max_limit_overall) *100) *100) / 100
}

//
// Formula used:         Total Number of ADP Transformations
//                     --------------------------------------
//                              Seconds in a Day
//                -------------------------------------------------- * 100
//                    Total transformations supported per Second
//
function computeAdpCapacity (transformCount) {
  let {total_capacity_tps} = stats.adp
  return Math.round((((transformCount/(24*60*60))/total_capacity_tps)*100) *100)/100

}

//
// Formula used:             Total file size in Bytes
//                     --------------------------------------
//                             Hours of the day (24)
//                -------------------------------------------------- * 100
//                    Average Bytes handled per hour (peak/offpeak)
//
function computeInterconnectCapacity (peakSize, offpeakSize) {
  let {peak_hour_start, peak_hour_end, hourly_stats} = stats.interconnect
  let peakIncrease = 0, offPeakIncrease = 0
  // let's comupte the average files processed per hour for the selected time period
  if (peakSize > 0) {
    let valueArr = hourly_stats.filter(v => v.hour >= peak_hour_start && v.hour <= peak_hour_end)
    let avgPerHour = valueArr.reduce((a,b) => a + b.size, 0) / valueArr.length;
    peakIncrease = Math.round((((peakSize * 1073741824)/24)/avgPerHour) *100) / 100
  }
  if (offpeakSize > 0) {
    let valueArr = hourly_stats.filter(v => v.hour < peak_hour_start || v.hour > peak_hour_end)
    let avgPerHour = valueArr.reduce((a,b) => a + b.size, 0) / valueArr.length;
    offPeakIncrease = Math.round((((offpeakSize * 1073741824)/24)/avgPerHour) *100) / 100
  }
  // now let's compute the increase
  let totIncrease = parseFloat((peakIncrease + offPeakIncrease).toFixed(2))
  return totIncrease
}

function GetStatusType (val) {
  if (val >= 0 && val <= 30)
    return "success"
  else if (val > 30 && val <= 60)
    return "warning"
  else
    return "error"
}

function GetOutlineColor (val) {
  if (val >= 0 && val <= 30)
    return "#008A02"
  else if (val > 30 && val <= 60)
    return "#df7a00"
  else
    return "#d63b33"
}

export {BuildEstimatesByTimeperiod,
  GetStatusType,
  GetOutlineColor}
