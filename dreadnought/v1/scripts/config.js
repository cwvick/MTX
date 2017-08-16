/**
 * (c) 2016 Digital River, Inc.
 *
 * @author msokola
 */

(function (global) {
	'use strict';
	
	global.config = {
		'backendHost' : global.backendUrl,
		'backendProtocol' : '',
		'default_dataType' : 'json',
		'auth' : '/rest/oauth/authorize',
		'meta' : '/rest/store/meta/v1',
		'usermeta' : '/rest/oauth/service/store/v1/me/meta',
		'post_payment' : '/rest/oauth/service/store/v1/me/paymentmethod',
		'offer':
			'/rest/services/offers/v2/' +
			'?from=0&count=10&orderBy=position&ascending=true&virtual=false',
		'offer_v3':
			'/rest/services/offers/v3/' +
			'?virtual=false&count=6&orderBy=position&ascending=true',
		'payment_authorize' : '/rest/oauth/service/store/payment/v1/me/authorize',
		'payment_capture' : '/rest/oauth/service/store/payment/v1/me/capture'
	};
})(this);