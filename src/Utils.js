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

function Transform(val) {
  // console.log(val);
  let transformed_json = [];
  let repos = uniq(val.map(a => a.repo_name));
  repos.forEach(element => {
    let filteredVals = val.filter(a => a.repo_name === element);
    let versions = [];
    filteredVals.forEach(el => {
      versions.push({"env": el.env_name, "version": el.release_version})
    })
    transformed_json.push({"repo_name": element, versions});
  })
  console.log(transformed_json);
  return transformed_json;
}

function uniq(a) {
  return a.sort().filter(function(item, pos, ary) {
      return !pos || item !== ary[pos - 1];
  });
}

export {Transform,
  GetStatusType,
  GetOutlineColor}
