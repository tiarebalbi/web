const config = {
	isProduction: false,
	isDebugable: true,
	isLogs: true,
	contribPluginsBaseUrl: 'https://github.com/lavab-plugins/',
	coreAppNames: ['LavaLoader', 'LavaUtils', 'LavaLogin', 'LavaMail'],
	defaultLanguageCode: 'en',
	defaultRootDomain: 'lavaboom.com',
	livereloadListenAddress: '0.0.0.0',
	livereloadListenPort: 35729,
	listenAddress: '0.0.0.0',
	listenPort: 5000,
	nodeVersion: '>=0.10.35'
};

config.defaultApiUri = config.isProduction ? 'https://api.lavaboom.com' : 'https://api.lavaboom.com';

module.exports = config;