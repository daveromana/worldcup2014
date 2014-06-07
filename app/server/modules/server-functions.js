function getInternalIp() {
	var ifconfig = require('os').networkInterfaces();
	var device, i, I, protocol;
 
	for (device in ifconfig) {
		// ignore network loopback interface
		if (device.indexOf('lo') !== -1 || !ifconfig.hasOwnProperty(device)) {
			continue;
		}
		for (i=0, I=ifconfig[device].length; i<I; i++) {
			protocol = ifconfig[device][i];
 
			// filter for external IPv4 addresses
			if (protocol.family === 'IPv4' && protocol.internal === true) {
				//console.log('found', protocol.address);
				return protocol.address;
			}
		}
	}
	return null;
}

module.exports.getInternalIp = getInternalIp;