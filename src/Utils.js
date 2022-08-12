function getStatusType (a, b) {

  let mod_a = a.replace('v', '').split('.');
  let mod_b = b.replace('v', '').split('.');

  if (mod_a[0] !== mod_b[0])
    return "error"
  else if (mod_a[1] !== mod_b[1])
    return "warning"
  else
    return "success"
}

function getOutlineColor (a, b) {
  console.log(a,b);
  let mod_a = a.replace('v', '').split('.');
  let mod_b = b.replace('v', '').split('.');

  if (mod_a[0] !== mod_b[0])
    return "#d63b33"
  else if (mod_a[1] !== mod_b[1])
    return "#df7a00"
  else
    return "#008A02"
}

function Transform(val, repo) {
  // console.log(val, repo);
  let transformed_json = [];
  let repos = uniq(val.map(a => a.repo_name));
  repos.forEach(element => {
    let filteredVals = val.filter(a => a.repo_name === element);
    let versions = [];
    let v;
    // get the version from git first
    let baseVersion = repo.filter(a => a.repo_name === element);
    versions.push({"env": "Git", "version": baseVersion[0].version});

    // then get all the versions from envs
    filteredVals.forEach(el => {
      let envObj = versions.filter(a => a.env === el.env_name);
      v = el.release_version;
      if (envObj.length > 0) {
        v = getHigherVersion(envObj[0].version, el.release_version);
        let filteredVersion = versions.filter(a => a.env !== el.env_name);
        // versions.pop({"env": el.env_name, "version": v});
        versions = filteredVersion;
      }
      versions.push({
        "env": el.env_name,
        "version": v,
        "color": getOutlineColor(baseVersion[0].version, v),
        "status": getStatusType(baseVersion[0].version, v)
      });
    })
    transformed_json.push({"repo_name": element, versions});
  })
  console.log(transformed_json);
  return transformed_json;
}

function getHigherVersion(a, b){
  if (!a)
    return b;

  let mod_a = a.replace('v', '').replaceAll('.', '');
  let mod_b = b.replace('v', '').replaceAll('.', '');
  if (parseInt(mod_a) > parseInt(mod_b))
    return a;
  else
    return b;
}

function uniq(a) {
  return a.sort().filter(function(item, pos, ary) {
      return !pos || item !== ary[pos - 1];
  });
}

export {Transform}
