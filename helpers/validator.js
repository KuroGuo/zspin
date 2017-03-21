const regexps = {
  zcoinAddress: /^a[a-zA-z0-9]{33}$/
}

exports.regexps = regexps

exports.isZcoinAddress = address => regexps.zcoinAddress.test(address)
