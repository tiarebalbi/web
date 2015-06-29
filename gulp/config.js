const config = {
	isProduction: false,
	isDebugable: true,
	isLogs: true,
	contribPluginsBaseUrl: 'https://github.com/lavab-plugins/',
	coreAppNames: ['LavaLoader', 'LavaUtils', 'LavaLogin', 'LavaMail'],
	defaultLanguageCode: 'en_US',
	livereloadListenAddress: '0.0.0.0',
	livereloadListenPort: 35729,
	listenAddress: '0.0.0.0',
	listenPort: 5000,
	nodeVersion: '>=0.10.35'
};

config.defaultRootDomain = config.isProduction ? 'lavaboom.com' : 'lavaboom.io';
config.defaultApiUri = 'https://api.' + config.defaultRootDomain;

module.exports = config;