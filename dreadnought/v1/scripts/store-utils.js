/* jshint ignore:start,-W101 */
if (typeof config == 'undefined') {
  config = {};
}

//-- Start Pre-defined variables --//
var authenticatedInfo = {
  language: storeLanguage.replace('-','_'),
  countryIdentifier: 'USA',
  token_type: null,
  access_token: null,
  expires_in: null
};
var paymentTransactionParameters = {
  paymentFormId: null,
  preSelectedPaymentForm: null,
  originPaymentFormId: null,
  paymentFormAccountId: null,
  termsAndConditionsId: null,
  recurringBuyer: null,
  hasDefaultPayment: null,
  offerId: null,
  originalOfferId: null,
  priceId: null,
  originalPriceId: null,
  ssoPriceId: null,
  ssoOfferId: null,
  ssoPaymentType: null,
  ssoCatalogType: null,
  addressId: null,
  creditCardId: null,
  bankBillingInfoId: null,
  selectedOffer: null,
  transactionId: null,
  externalTransactionId: null,
  externalCampaignId: null,
  currencyIdentifier: null,
  currencySymbol: null,
  storeMaintenance: null,
  thankYouPageType: null,
  showDetailsInStore: false,
  transactionStep: null,
  regions: null,
  freeText: null,
  addressInfo: {
    firstName: null,
    lastName: null,
    city: null,
    street1: null,
    street2: null,
    zipCode: null,
    countryCode: null,
    stateCode: null,
    stateText: null,
    phone: null,
    email: null,
    externalId: null,
    id: null,
    accountId: null,
    type: null
  },
  creditCard: {
    creditCardExternalId: null,
    expiresMonth: null,
    expiresYear: null,
    expiresMonthForUI: null,
    expiresYearForUI: null,
    name: null,
    unencryptedNumber: null,
    securityCode: null,
    type: 'VISA',
    lastFourDigits: null
  },
  ELV: {
    bankBillingInfoExternalId: null,
    bankBranchNumber: null,
    bankName: null,
    bankAccountHolder: null,
    unencryptedNumber: null,
    displayValue: null
  },
  SDD: {
    bankBillingInfoExternalId: null,
    bankAccountHolder: null,
    bankBranchNumber: null,
    unencryptedNumber: null,
    displayValue: null,
    emailAsSignature: null,
    mandate: null
  },
  bankBilling: {
    bankBillingInfoExternalId: null,
    bankBranchNumber: null,
    bankName: null
  },
  banks: null,
  returningUserShouldEnterCVV: null,
  referencedBilling: {
    referenceEntityId: null,
    referencedBillingInfoExternalId: null
  },
  referenceBillingInfoId: null,
  sellingEntity: null,
  taxOnTop: null,
  externalUrl: {
    formString: null
  }
};
var storeProperties = {};

var apiPath = {
  initUrlPath: function() {
    this.urlPath = config.backendProtocol + '//' + config.backendHost;
  },
  authenticateUrl: function() {
    this.initUrlPath();
    //Pass all parameters to authenticate API
    var ssoParams = (window.location.search === "") ? "" : "&" + window.location.search.substring(1);
    return this.urlPath + config.auth + '?client=' + clientType + ssoParams;
  },
  userMetaUrl: function() {
    return this.urlPath + config.usermeta + '?scope=' + scopeType + '&client=' + clientType;
  },
  metaUrl: function() {
    return this.urlPath + config.meta + '?language=' + authenticatedInfo.language + '&country=' + authenticatedInfo.countryIdentifier + '&client=' + clientType;
  },
  termsLink: function() {
    return this.urlPath + config.meta + '?language=' + authenticatedInfo.language + '&country=' + authenticatedInfo.countryIdentifier + '&onlyTerms=true&client=' + clientType;
  },
  offerUrl: function() {
    return this.urlPath + config.offer + '&language=' + authenticatedInfo.language + '&country=' + authenticatedInfo.countryIdentifier + '&client=' + clientType + '&referenceId=' + getUrlVars().referenceId;
  },
  subscriptionOfferUrl: function() {
    return this.urlPath + config.subscription_offer + '&language=' + authenticatedInfo.language + '&country=' + authenticatedInfo.countryIdentifier + '&client=' + clientType;
  },
  clearBillingUrl: function() {
    return this.urlPath + config.post_payment + '/' + scopeType + '?client=' + clientType;
  },
  paymentUpdateUrl: function() {
    return this.urlPath + config.post_payment + '?client=' + clientType;
  },
  authorizeUrl: function() {
    return this.urlPath + config.payment_authorize + '?client=' + clientType;
  },
  captureUrl: function() {
    return this.urlPath + config.payment_capture + '?client=' + clientType;
  },
  cancelSubscriptionUrl: function() {
    return this.urlPath + config.subscription_cancel + '?client=' + clientType;
  },
  loadSubscriptionUrl: function(transactionId) {
    return this.urlPath + config.subscription_transaction + transactionId + '?client=' + clientType;
  },
  reactivateUrl: function() {
    return this.urlPath + '/rest/oauth/service/store/v1/me/subscription/reactivate' + '?client=' + clientType;
  },
  finalizeUrl: function() {
    return this.urlPath + '/rest/oauth/service/store/payment/v1/me/finalize/' + paymentTransactionParameters.transactionId + '?client=' + clientType + '&fields=transaction';
  },
  walletUrl: function() {
    return this.urlPath + '/rest/oauth/service/store/v1/me/wallet?currency=bought&client=' + clientType;
  },
  couponRedeemUrl: function() {
    return this.urlPath + '/rest/oauth/service/store/coupon/v1/capture' + '?client=' + clientType;
  },
  allowedHostAPIOrigins: function() {
    return config.gems_host_api;
  },
  campaignsUrl: function() {
    return this.urlPath + config.upselling + '?language=' + authenticatedInfo.language + '&referenceId=' + getUrlVars().referenceId;
  },
  campaignsOfferUrl: function() {
    return this.urlPath + '/rest/services/campaigns/v3/' + storeParam.catalog + '/' + paymentTransactionParameters.externalCampaignId + '/offers?language=' + authenticatedInfo.language;
  }
};
//-- End Pre-defined variables --//

//-- Start Shared functions --//
$.extend({
  localize: function(key, resultNullable) {
    if (typeof key == 'undefined' || key === null) {
      return "undefined";
    }
    if (key.indexOf("drog.") !== 0) {
      key = "drog." + key;
    }
    var localization;
    if (_localizations) {
      localization = _localizations[key];
    }
    if (resultNullable) {
      return localization;
    }
    return (typeof localization == 'undefined') ? key : localization;
  }
});

function getUrlVars() {
  var w = window;
  var vars = {},
    hash;
  var hashes = w.location.href.slice(w.location.href.indexOf('?') + 1).replace(/#.*/, '').split('&');
  for (var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split('=');
    vars[hash[0]] = hash[1];
  }
  return vars;
}

function countdownFormat(sec_num, formatStr) {
  //support %d %H %M %S
  var days = Math.floor(sec_num / 86400);
  var hours = (formatStr.indexOf('%d') == -1) ? (Math.floor(sec_num / 3600)) : (Math.floor((sec_num - (days * 86400)) / 3600));
  var minutes = (formatStr.indexOf('%d') == -1) ? (Math.floor((sec_num - (hours * 3600)) / 60)) : (Math.floor((sec_num - (days * 86400) - (hours * 3600)) / 60));
  var seconds = (formatStr.indexOf('%d') == -1) ? (sec_num - (hours * 3600) - (minutes * 60)) : (sec_num - (days * 86400) - (hours * 3600) - (minutes * 60));

  this.dateMarkers = {
    d: [function() {
      if (days < 10) {
        days = "0" + days;
      }
      return days;
    }],
    H: [function() {
      if (hours < 10) {
        hours = "0" + hours;
      }
      return hours;
    }],
    M: [function() {
      if (minutes < 10) {
        minutes = "0" + minutes;
      }
      return minutes;
    }],
    S: [function() {
      if (seconds < 10) {
        seconds = "0" + seconds;
      }
      return seconds;
    }]
  };
  var dateMarkers = this.dateMarkers;
  var time = formatStr.replace(/%(.)/g, function(m, p) {
    if (dateMarkers[p][0] !== null) {
      rv = dateMarkers[p][0]();
    }
    return rv;
  });
  return time;
}

$.fn.countdown = function(callback, duration, formatStr) {
  // Get reference to container, and set initial content
  var container = $(this).html(countdownFormat(duration, formatStr));
  // Get reference to the interval doing the countdown
  var countdown = setInterval(function() {
    // If seconds remain
    if (--duration) {
      // Update our container's message
      container.html(countdownFormat(duration, formatStr));
      // Otherwise
    } else {
      // Clear the countdown interval
      clearInterval(countdown);
      // And fire the callback passing our container as `this`
      if (typeof(callback) == 'function') {
        callback.call(container);
      }
    }
    // Run interval every 1000ms (1 second)
  }, 1000);
};

function currencySymbol(_currency) {
  var _symbol = _currency;

  switch (_currency) {
    case "USD":
      _symbol = "$";
      break;
    case "CAD":
      _symbol = "C$";
      break;
    case "AUD":
      _symbol = "A$";
      break;
    case "NZD":
      _symbol = "NZ$";
      break;
    case "TWD":
      _symbol = "NT$";
      break;
    case "RUB":
      _symbol = "руб";
      break;
    case "JPY":
      _symbol = "\u5186";
      break;
    case "EUR":
      _symbol = "\u20AC";
      break;
    case "GBP":
      _symbol = "\u20A4";
      break;
    case "CHF":
      _symbol = "SF<span style='text-transform: lowercase;'>r </span>";
      break;
    case "PLN":
      _symbol = "<span class='symbol_left'>&#x7a;&#x142;</span>";
      break;
    case "DKK":
    case "NOK":
      _symbol = "<span class='symbol_left'>kr</span>";
      break;
    case "SEK":
      _symbol = "<span class='symbol_right'>kr</span>";
      break;
    case "TRY":
      _symbol = "\u20BA";
      break;
    default:
      _symbol = paymentTransactionParameters.currencySymbol || _currency;
      break;
  }

  return _symbol;
}

//DROG-2940
//"Foreign currencies show no extra decimal places if some of the SKUs have them. This was specifically noted with GBP. 
//Example: 800 Gems is sold for 8.5 GBP while the 1600 Gem SKU is sold for 17 GBP. They should be 8.50 GBP and 17.00 GBP, respectively."
function formatedPrice(_price, forceTrailing, genToHtml) {
  var currency = (_price.price && typeof _price.price.isoCode !== 'undefined') ? _price.price.isoCode : (_price.currency || paymentTransactionParameters.currencyIdentifier);
  var amount = (_price.price && typeof _price.price.decimalAmount !== 'undefined') ? (_price.price.decimalAmount) : (_price.price || _price);
  
  if (currency == 'JPY') {
    var jypFormat = separateNumberWithComma(parseFloat(amount).toFixed(2));
    return jypFormat + ' ' + currencySymbol(currency);
  } else if (currency == 'TRY') {
    return parseFloat(amount).toFixed(2).replace('.',',') + ' ' + currencySymbol(currency);
  } else if (currency == 'TWD') {
    return currencySymbol(currency) + separateNumberWithComma(parseFloat(amount).toFixed(2));
  } else if (currency == 'RUB') {
    var rubFormate = separateNumberWithDot(parseFloat(amount).toFixed(2));
    return rubFormate.replace(/\.([^\.]*)$/, ",$1") + ' ' + currencySymbol(currency);
  } else if (currency == 'SEK') {
    return parseFloat(amount).toFixed(2).replace('.',',') + currencySymbol(currency);
  } else if (currency == 'EUR' || currency == 'CHF' || currency == 'PLN' || currency == 'DKK' || currency == 'NOK') {
    return currencySymbol(currency) + parseFloat(amount).toFixed(2).replace('.',',');
  } else {
    return currencySymbol(currency) + parseFloat(amount).toFixed(2);
  }
}
var separateNumberWithDot = function(val) {
  while (/(\d+)(\d{3})/.test(val.toString())) {
    val = val.toString().replace(/(\d+)(\d{3})/, '$1' + '.' + '$2');
  }
  return val;
};
var separateNumberWithComma = function(val) {
  while (/(\d+)(\d{3})/.test(val.toString())) {
    val = val.toString().split('.')[0].replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
  }
  return val;
};

var isCountdownOffer = function(_offer) {
  if (typeof _offer.countdown !== 'undefined' && _offer.countdown !== null) {
    if (typeof _offer.countdown.endDate !== 'undefined' && _offer.countdown.endDate !== null) {
      return true;
    }
  }
  return false;
};
var hasValidPrice = function(_offer) {
  if (typeof _offer.prices !== 'undefined' && _offer.prices !== null && _offer.prices.length) {
    if (typeof _offer.prices[0].id !== 'undefined' && typeof _offer.prices[0].price !== 'undefined') {
      return true;
    }
  }
  return false;
};
var matchPriceId = function(_offer, _priceId) {
  if (_priceId !== null && typeof _offer.prices !== 'undefined' && _offer.prices !== null && _offer.prices.length) {
    for (var priceIndex in _offer.prices) {
      var _price = _offer.prices[priceIndex];
      if (typeof _price.id !== 'undefined' && _price.id === _priceId) {
        return _price;
      }
    }
  }
  return null;
};
var matchOfferId = function(_offer, _offerId) {
  if (_offerId !== null && typeof _offer.prices !== 'undefined' && _offer.prices !== null && _offer.prices.length) {
    if (typeof _offer.id !== 'undefined' && _offer.id === _offerId) {
      return true;
    }
  }
  return false;
};
var getValidOfferImage = function(_offer) {
  if (typeof _offer.images !== 'undefined' && _offer.images !== null && _offer.images.length) {
    if (typeof _offer.images[0].label !== 'undefined' && typeof _offer.images[0].uri !== 'undefined' && _offer.images[0].uri !== null) {
      if (_offer.images[0].label == "1") {
        return _offer.images[0].uri;
      }
    }
  }
  return "";
};
/**
 * creates DNS pixel entry
 * @param data contains server response
 */
function addDNSPixel(data) {
  // check if request headers have been received successfully
  if (data.requestHeaders) {
    if (data.requestHeaders.dnsPixelUrl) {
      var dnsPixelUrl = data.requestHeaders.dnsPixelUrl;

      var img = new Image(1, 1);
      img.src = '//' + dnsPixelUrl;
      $('body').append(img);
    }
  }
}

function DateFmt() {
  this.dateMarkers = {
    d: ['getDate', function(v) {
      return ("0" + v).slice(-2);
    }],
    m: ['getMonth', function(v) {
      return ("0" + (v + 1)).slice(-2);
    }],
    n: ['getMonth', function(v) {
      var mthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return mthNames[v];
    }],
    w: ['getDay', function(v) {
      var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return dayNames[v];
    }],
    y: ['getFullYear', function(v) {
      return v;
    }],
    H: ['getHours', function(v) {
      return ("0" + v).slice(-2);
    }],
    M: ['getMinutes', function(v) {
      return ("0" + v).slice(-2);
    }],
    S: ['getSeconds', function(v) {
      return ("0" + v).slice(-2);
    }],
    i: ['toISOString', null]
  };

  this.format = function(date, fmt) {
    var dateMarkers = this.dateMarkers;
    var dateTxt = fmt.replace(/%(.)/g, function(m, p) {
      var rv = date[(dateMarkers[p])[0]]();
      if (dateMarkers[p][1] !== null) {
        rv = dateMarkers[p][1](rv);
      }
      return rv;
    });
    return dateTxt;
  };
}

function leadingZero(num) {
  return ("0" + num).substr(-2, 2);
}
getTimeZoneInfo = function() {
  // get timezone offsets
  var now = new Date();

  var timeZoneInfo = {
    // current timezone offset in minutes
    timeZoneOffset: now.getTimezoneOffset(),
    //winter time zone offset, in minutes - the captured value of WO should be sent
    timeZoneSSOffset: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTimezoneOffset(),
    //summer time zone offset, in minutes - the captured value of SO should be sent
    timeZoneNSOffset: new Date(now.getFullYear(), 6, 1, 0, 0, 0, 0).getTimezoneOffset()
  };
  return timeZoneInfo;
};

function replaceStringArgs(_str, _args) {
  for (var index in _args) {
    _str = _str.replace('{' + index + '}', _args[index]);
  }
  return _str;
}

function hasNumber(s) {
  var re = /\d/;
  return re.test(s);
}

function bindAddressData(address) {
  paymentTransactionParameters.addressInfo = {
    id: address.addressDetailId,
    city: address.city,
    countryCode: address.countryCode,
    email: address.email,
    externalId: null,
    accountId: address.accountId,
    firstName: address.firstName,
    lastName: address.lastName,
    phone: address.phone,
    stateCode: address.stateCode,
    stateText: address.stateText,
    street1: address.street1,
    street2: address.street2,
    zipCode: address.zipCode
  };
}

function processPaymentOption(pmt, pmtOption) {
  //show default payment option
  if (pmt.defaultPayment) {
    //defaultPayment for recurring buyer, take scope != null
    if (!paymentTransactionParameters.recurringBuyer || (paymentTransactionParameters.recurringBuyer && (pmt.scope !== null))) {
      paymentTransactionParameters.paymentFormId = pmt.paymentType;
      paymentTransactionParameters.originPaymentFormId = pmt.paymentType;
      pmtOption.prop('selected', true).trigger('change');
    }
  }
}

// NOTE: Since we don't support multiple payment form in HTC store, we only store the first payment data which we retrieve from usermeta. [Vick 2015.11.10]
function bindPaymentData(pmt) {
  // Bind credit card data
  if (pmt.paymentType == "cpgCreditCard" && (typeof pmt.paymentInfoExternalId !== "undefined") && (pmt.paymentInfoExternalId !== null) && ((!paymentTransactionParameters.creditCardId) || (pmt.creditCardExternalId > paymentTransactionParameters.creditCardId))) {
    paymentTransactionParameters.creditCardId = pmt.creditCardExternalId;
    paymentTransactionParameters.creditCard.creditCardExternalId = pmt.creditCardExternalId;
    paymentTransactionParameters.creditCard.expiresMonth = pmt.expiresMonth;
    paymentTransactionParameters.creditCard.expiresMonthForUI = pmt.expiresMonthForUI;
    paymentTransactionParameters.creditCard.expiresYear = pmt.expiresYear;
    paymentTransactionParameters.creditCard.expiresYearForUI = pmt.expiresYearForUI;
    paymentTransactionParameters.creditCard.name = pmt.name;
    paymentTransactionParameters.creditCard.type = pmt.type;
    paymentTransactionParameters.creditCard.lastFourDigits = pmt.lastFourDigits;
  } 
  // Bind ELV data
  if (pmt.paymentType == "cpgELV" && (typeof pmt.paymentInfoExternalId !== "undefined") && (pmt.paymentInfoExternalId !== null) && !paymentTransactionParameters.ELV.bankBillingInfoExternalId) {              
    paymentTransactionParameters.ELV.bankBillingInfoExternalId = pmt.bankBillingInfoExternalId;
    paymentTransactionParameters.ELV.bankBranchNumber = pmt.bankBranchNumber;
    paymentTransactionParameters.ELV.bankName = pmt.bankName;
    paymentTransactionParameters.ELV.bankAccountHolder = pmt.bankAccountHolder;
    paymentTransactionParameters.ELV.displayValue = pmt.displayValue;
  }
  // Bind SDD data
  if (pmt.paymentType == "cpgSEPADirectDebit" && (typeof pmt.paymentInfoExternalId !== "undefined") && (pmt.paymentInfoExternalId !== null) && !paymentTransactionParameters.SDD.bankBillingInfoExternalId) {              
    paymentTransactionParameters.SDD.bankBillingInfoExternalId = pmt.bankBillingInfoExternalId;
    paymentTransactionParameters.SDD.bankBranchNumber = pmt.bankBranchNumber;
    paymentTransactionParameters.SDD.bankAccountHolder = pmt.bankAccountHolder;
    paymentTransactionParameters.SDD.displayValue = pmt.displayValue;
  } 
  // Bind IBP data
  if (pmt.paymentType == "cpgIBP" && (typeof pmt.paymentInfoExternalId !== "undefined") && (pmt.paymentInfoExternalId !== null) && !paymentTransactionParameters.bankBilling.bankBillingInfoExternalId) {              
    paymentTransactionParameters.bankBilling.bankBillingInfoExternalId = pmt.bankBillingInfoExternalId;
    paymentTransactionParameters.bankBilling.bankBranchNumber = pmt.bankBranchNumber;
    paymentTransactionParameters.bankBilling.bankName = pmt.bankName;
  }
  // Bind PayPal PreApproved data
  if (pmt.paymentType == "cpgPayPalPreApproved" && (typeof pmt.referencedBillingInfoExternalId !== "undefined") && (pmt.referencedBillingInfoExternalId !== null)) {
    paymentTransactionParameters.referenceBillingInfoId = pmt.referencedBillingInfoExternalId;
    paymentTransactionParameters.referencedBilling.referencedBillingInfoExternalId = pmt.referencedBillingInfoExternalId;
  }
}

//support customized callback functions
function loadAjaxData(url, CallbackOptions, ObjCallback) {
  var _data;
  $.when($.ajax({
    url: url,
    xhrFields: {
      withCredentials: true
    },
    cache: false,
    error: function(xhr, ajaxOptions, thrownError) {
      if ( console && console.log ) {
        console.log("url: " + url);
        console.log("fn loadAjaxData xhr.status: " + xhr.status);
        console.log("fn loadAjaxData thrownError: " + thrownError);
      }
      if (CallbackOptions.errorCB !== undefined && typeof CallbackOptions.errorCB === 'function') {
        CallbackOptions.errorCB(xhr, ajaxOptions, thrownError);
      }
    },
    dataType: config.default_dataType,
    jsonpCallback: "callback",
    beforeSend: function(xhr) {
      if (CallbackOptions.beforeSendCB !== undefined && typeof CallbackOptions.beforeSendCB === 'function') {
        CallbackOptions.beforeSendCB(xhr);
      }
    },
    complete: function(data) {
      if (CallbackOptions.completeCB !== undefined && typeof CallbackOptions.completeCB === 'function') {
        CallbackOptions.completeCB(data);
      }
    },
    success: function(data) {
      _data = data;
      if (CallbackOptions.successCB !== undefined && typeof CallbackOptions.successCB === 'function') {
        CallbackOptions.successCB(data);
      }
    }
  })).done(function() {
    if (typeof ObjCallback === 'function') {
      ObjCallback(_data);
    }
  });
}

function authenticate(url, CallbackOptions, ObjCallback) {
  $.ajax({
    async: true,
    url: url,
    dataType: config.default_dataType,
    jsonpCallback: 'callback',
    cache: false,
    xhrFields: {
      withCredentials: true
    },
    type: 'GET',
    beforeSend: function(xhr) {
      if (CallbackOptions.beforeSendCB !== undefined && typeof CallbackOptions.beforeSendCB === 'function') {
        CallbackOptions.beforeSendCB(xhr);
      }
    },
    complete: function(data) {
      if (CallbackOptions.completeCB !== undefined && typeof CallbackOptions.completeCB === 'function') {
        CallbackOptions.completeCB(data);
      }
    },
    error: function(xhr, ajaxOptions, thrownError) {
      if ( console && console.log ) {
        console.log("fn authenticate xhr.status: " + xhr.status);
        console.log("fn authenticate xhr.responseText: " + xhr.responseText);
        console.log("fn authenticate thrownError: " + thrownError);
      }
      if (CallbackOptions.errorCB !== undefined && typeof CallbackOptions.errorCB === 'function') {
        CallbackOptions.errorCB(xhr, ajaxOptions, thrownError);
      }
    },
    success: function(response) {
      authenticatedInfo.token_type = response.token_type;
      authenticatedInfo.access_token = response.access_token;
      authenticatedInfo.expires_in = response.expires_in;

      if (CallbackOptions.successCB !== undefined && typeof CallbackOptions.successCB === 'function') {
        CallbackOptions.successCB(response);
      }
    }
  });
}

$.validator.addMethod("noNumbers", function(value) {
  var numbers = /\d/;
  if (numbers.test($.trim(value))) {
    return false;
  } else {
    return true;
  }
}, $.localize("drog.numeric.characters.are.not.allowed.please.try.again"));
$.validator.addMethod("alphanumeric", function(value) {
  return /^[a-zA-Z\s]+$/i.test(value);
}, $.localize("drog.letters.only.please"));
$.validator.addMethod("forLastName", function(value) {
  return (/\s+/.test($.trim(value)));
}, $.localize("drog.please.provide.a.valid.name"));

$.validator.addMethod("forFirstNameLength", function(value) {
  var lNameExists = /\s+/.test($.trim(value));
  var fName = value;
  if (value.indexOf(" ") > -1) {
    fName = value.substring(0, value.lastIndexOf(" "));
  }
  if (fName.length <= 25) {
    return true;
  } else {
    return false;
  }
}, $.localize("drog.your.first.name.must.be.twenty.five.characters.or.less"));

$.validator.addMethod("forFirstNameMinLength", function(value, element) {
  var lNameExists = /\s+/.test($.trim(value));
  var fName = value;
  if (value.indexOf(" ") > -1) {
    fName = value.substring(0, value.indexOf(" "));
  }
  if ($(element).attr('id') == 'firstname') {
    fName = $("#firstname").val().trim();
  }
  if (fName.length <= 1 && /[\u0020-\u007F\u00A0-\u024F\u1E00-\u1EFF]+/.test(fName)) {
    // 2016-08-23 check if it's latin character to match backend rule
    // Dev comment: We check if it is one character and this character is latin character.
    return false;
  } else {
    return true;
  }
}, $.localize("drog.your.first.name.must.be.longer.than.one.character"));

$.validator.addMethod("forLastNameLength", function(value) {
  var lNameExists = /\s+/.test($.trim(value));
  var lName = value.substring(value.lastIndexOf(" ") + 1);
  if (lNameExists) {
    if (lName.length <= 25) {
      return true;
    } else {
      return false;
    }
  }
}, $.localize("drog.your.last.name.must.be.twenty.five.characters.or.less"));

$.validator.addMethod("forLastNameMinLength", function(value, element) {
  var lNameExists = /\s+/.test($.trim(value));
  var lName = value.substring(value.indexOf(" ") + 1);
  if ($(element).attr('id') == 'lastname') {
    lNameExists = true;
    lName = $("#lastname").val().trim();
  }
  if (lNameExists) {
    if (lName.length <= 1 && /[\u0020-\u007F\u00A0-\u024F\u1E00-\u1EFF]+/.test(lName)) {
      // 2016-08-23 check if it's latin character to match backend rule
      // Dev comment: We check if it is one character and this character is latin character.
      return false;
    } else {
      return true;
    }
  }
}, $.localize("drog.your.last.name.must.be.longer.than.one.character"));

$.validator.addMethod("forURLFilter", function(value) {
  var emailReg = /[\w-\.]+@([\w-]+\.)+[\w-]{2,}?/;
  var urlPattern = /([\w-]+\.)+[a-zA-Z]{2,}?/;
  var ipPattern = /([\/\/])?([\d]+\.){3}([\d]+)/;
  var slashPattern = /(http|https|ftp|telnet):([\/\/])?/;
  if (emailReg.test($.trim(value)) || urlPattern.test($.trim(value)) || ipPattern.test($.trim(value)) || slashPattern.test($.trim(value))) {
    return false;
  } else {
    return true;
  }
}, $.localize("drog.this.field.may.not.contain.a.url"));

$.validator.addMethod("forPhoneFilter", function(value) {
  var pattern = /^(\+|\()?(\d{1,3})\)?[-. ]?([\d]{3,}[-. ]?)+(\d{3,})$/;
  if (pattern.test($.trim(value))) {
    return true;
  } else {
    return false;
  }
}, $.localize("drog.please.enter.a.valid.phone.number"));

$.validator.addMethod("forValidSymbolFilter", function(value, element) {
  // D-07846 Zenimax - Fallout Shelter - Korean, Russian, and Arabic characters not accepted
  // Arabic characters: \u0600-\u06FF\u0750-\u077F\uFB50-\uFC3F\uFE70-\uFEFC
  // Polish letters: \u0100-\u024F
  var pattern = /^([\w\s\dÀÈÌÒÙàèìòùÁÉÍÓÚÝáéíóúýÂÊÎÔÛâêîôûÃÑÕãñõÄËÏÖÜäëïöüçÇßØøÅåÆæÞþÐð¡а-яА-ЯёЁ°\u0100-\u024F\u2E80-\u9FFF\u1100-\u11FF\uAC00-\uD7AF\u0590-\u05FF]|[\u0600-\u06FF\u0750-\u077F\uFB50-\uFC3F\uFE70-\uFEFC])*([\w\-\s\dÀÈÌÒÙàèìòùÁÉÍÓÚÝáéíóúýÂÊÎÔÛâêîôûÃÑÕãñõÄËÏÖÜäëïöüçÇßØøÅåÆæÞþÐð¡а-яА-ЯёЁ°,.’'\/?\u0100-\u024F\u2E80-\u9FFF\u1100-\u11FF\uAC00-\uD7AF\u0590-\u05FF]|[\u0600-\u06FF\u0750-\u077F\uFB50-\uFC3F\uFE70-\uFEFC])+$/;
  var patterntwo =  /^([\w\s\dÀÈÌÒÙàèìòùÁÉÍÓÚÝáéíóúýÂÊÎÔÛâêîôûÃÑÕãñõÄËÏÖÜäëïöüçÇßØøÅåÆæÞþÐð¡©°]{1,})$/;
  var patternRestrict = /[<>\(\)\{\}\$!%&:;`"\\]+/;
  var patternPeriod = /\d\../;

  // D-07392 Zenimax - Cardinal # symbol causing error in UI
  if ($(element).attr('id') == 'address' || $(element).attr('id') == 'addressExtra') {
    pattern = /^([\w\s\d#ÀÈÌÒÙàèìòùÁÉÍÓÚÝáéíóúýÂÊÎÔÛâêîôûÃÑÕãñõÄËÏÖÜäëïöüçÇßØøÅåÆæÞþÐð¡а-яА-ЯёЁ°\u0100-\u024F\u2E80-\u9FFF\u1100-\u11FF\uAC00-\uD7AF\u0590-\u05FF]|[\u0600-\u06FF\u0750-\u077F\uFB50-\uFC3F\uFE70-\uFEFC])*([\w\-\s\d#ÀÈÌÒÙàèìòùÁÉÍÓÚÝáéíóúýÂÊÎÔÛâêîôûÃÑÕãñõÄËÏÖÜäëïöüçÇßØøÅåÆæÞþÐð¡а-яА-ЯёЁ°,.’'\/?\u0100-\u024F\u2E80-\u9FFF\u1100-\u11FF\uAC00-\uD7AF\u0590-\u05FF]|[\u0600-\u06FF\u0750-\u077F\uFB50-\uFC3F\uFE70-\uFEFC])+$/;
  }

  if ( !$.trim(value) ) {
    return true;
  } else {
    if ((pattern.test($.trim(value)) && !patternRestrict.test($.trim(value)) && !patternPeriod.test($.trim(value)) && value.indexOf("//") < 0 && value.indexOf("--") < 0 && value.indexOf("/-") < 0 && value.indexOf("-/") < 0) || (value.length == 1 && patterntwo.test($.trim(value)))) {
      return true;
    } else {
      return false;
    }
  }
  
}, $.localize("drog.this.field.may.not.contain.special.characters"));

$.validator.addMethod('supportSpecialCharEmail', function(value) {
  // var specialCharacter = 'ÀÈÌÒÙàèìòùÁÉÍÓÚÝáéíóúýÂÊÎÔÛâêîôûÃÑÕãñõÄËÏÖÜäëïöüąçÇßØÖÜåÆæÞþÐð¡а-яА-ЯёЁ©°\u0100-\u024F\u2E80-\u9FFF\u1100-\u11FF\uAC00-\uD7AF\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\uFB50-\uFC3F\uFE70-\uFEFC\u0600-\u06FF\u0750-\u077F\uFB50-\uFC3F\uFE70-\uFEFC';
  // var specialSymbol = "!?#\$%\^\&*\)\(+=_.-";
  // var localPattern = "[a-zA-Z0-9" + specialCharacter + specialSymbol +"]+";  
  // var domainPattern = '[a-zA-Z0-9' +  specialCharacter + '](?:[a-zA-Z0-9-' +  specialCharacter +']{0,61}[a-zA-Z0-9])?';    
  // var extensionPattern = '[A-Za-z]{2,10}';
  // var pattern = new RegExp( '^' + localPattern + '@' + domainPattern + '[.]' + extensionPattern + '$');
  
  // D-08960 6ft - second period in email address after @ sign prevents checkout
  // adopt regex in jquery.validate 1.10
  var pattern = /^((([a-zA-Z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-zA-Z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/;
  var patternPeriod = /[\.]{2,}/;
  if (pattern.test($.trim(value)) && !patternPeriod.test($.trim(value))) {
    return true;
  } else {
    return false;
  }
}, $.localize("drog.please.enter.a.valid.email.address"));

$.validator.addMethod("forZipFilter", function(value) {
  var pattern = /^[\w \-]*[\w\-][\w \-]*$/;
  if (pattern.test($.trim(value))) {
    return true;
  } else {
    return false;
  }
}, $.localize("drog.this.field.may.not.contain.special.characters"));

$.validator.addMethod("forUSZipFilter", function(value) {
  var pattern = /^\d{5}(-\d{4})?$/;
  if (pattern.test($.trim(value))) {
    return true;
  } else {
    return false;
  }
}, $.localize("drog.the.entry.of.your.zip.code.is.invalid.please.try.again"));

var validMonthAndYear = true;
$.validator.addMethod('CCExp', function(value, element, params) {
  var minMonth = new Date().getMonth() + 1;
  var minYear = new Date().getFullYear();
  var maxYear = 2100;
  var month = parseInt($(params.month).val(), 10);
  var year = parseInt($(params.year).val(), 10);
  if (params.month && (!params.year || isNaN(year))) {
    return ((month > 0 && month <= 12));
  } else {
    if ((month > 0 && month <= 12) && (year < maxYear) && (year > minYear || (year === minYear && month >= minMonth))) {
      $(element).parent('div').removeClass("error");
      if (!validMonthAndYear) {
        validMonthAndYear = true;
        $('#cardExpirationYear').valid();
        $('#cardExpirationMonth').valid();
      }
      return true;
    } else {
      $(element).parent('div').addClass("error");
      validMonthAndYear = false;
      return false;
    }
  }
}, $.localize("drog.your.credit.card.expiration.date.is.invalid"));

$.validator.addMethod('supportedCard', function(value) {
  //DROG-6351 find card type by reg expression, should cover all card types
  return (getCreditCardType(value.split("-").join("")) == 'unknown') ? false : true;
  //return value.luhnCheck();
}, $.localize("drog.your.credit.card.is.invalid"));

// Luhn algorithm validator
String.prototype.luhnCheck = function() {
  var luhnArr = [
      [0, 2, 4, 6, 8, 1, 3, 5, 7, 9],
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    ],
    sum = 0;
  this.replace(/\D+/g, "").replace(/[\d]/g, function(c, p, o) {
    sum += luhnArr[(o.length - p) & 1][parseInt(c, 10)];
  });
  return (sum % 10 === 0) && (sum > 0);
};

$.validator.addMethod('validBankId', function(value) {
  var bank_select = $("#ibpBankName");
  var bankData = bank_select.data('banks');
  //find bank name
  for (var _index in bankData) {
    if (bankData[_index].bankName == value) {
      if ($("#ibpBankName").is("input[type=text]")) {
        ($("#ibpBankName").attr('bank-id', bankData[_index].bankId));
      }
      paymentTransactionParameters.bankBilling.bankName = bankData[_index].bankName;
      paymentTransactionParameters.bankBilling.bankBranchNumber = bankData[_index].bankId;
      // console.log("Validated Bank Id:" + value);
      return true;
    }
  }
  //no matched bank name
  paymentTransactionParameters.bankBilling.bankBillingInfoExternalId = null;
  paymentTransactionParameters.bankBilling.bankName = null;
  paymentTransactionParameters.bankBilling.bankBranchNumber = null;
  return false;
}, $.localize("drog.select.bank.from.dropdown"));

$.validator.addMethod('validStateId', function(value) {
  //stateId must from dropdown
  var state_select = $("#state");
  var stateData = state_select.data('states');
  //find state localized name
  for (var states_index in stateData) {
    if (stateData[states_index].localizedName == value) {
      $("#state").attr('state-id', stateData[states_index].shortDescription);
      // console.log("Validated State Id:" + value);
      return true;
    }
  }
  return false;
}, $.localize("drog.select.state.from.dropdown"));

$.validator.addMethod('sepa_validAccountNumber', function(value) {
  var countryCode = authenticatedInfo.countryIdentifier;
  var pattern = /^DE\d{20}$/;

  if (countryCode == 'AUT') {
    pattern = /^AT\d{18}$/;
  } else if (countryCode == 'DEU') {
    pattern = /^DE\d{20}$/;
  } else if (countryCode == 'NLD') {
    pattern = /^NL\d{2}[A-Z]{4}\d{10}$/;
  }

  if (pattern.test($.trim(value))) {
    return true;
  } else {
    return false;
  }
}, $.localize("drog.error.enter.valid.account.number"));

$.validator.addMethod('sepa_validBIC', function(value) {
  //BIC8 or BIC11s (with 3 additional characters)
  var pattern = /^[A-Za-z]{6}[A-za-z0-9]{2}([A-za-z0-9]{3})?$/;
  if (pattern.test($.trim(value))) {
    return true;
  } else {
    return false;
  }
}, $.localize("drog.error.enter.valid.BIC.number"));

var DetermineErrMsg = function() {
  if (getUrlVars().errorMsg !== null && getUrlVars().errorMsg !== "") {
    var _msg = decodeURIComponent(getUrlVars().errorMsg);
    //only show error message within 3 seconds
    var _msgTS, now = new Date();
    if ( getUrlVars().msgTS ) {
      if (getUrlVars().msgTS.indexOf("#") > 0) {
        _msgTS = getUrlVars().msgTS.substr(0, getUrlVars().msgTS.indexOf("#"));
      } else {
        _msgTS = getUrlVars().msgTS;
      }
      if (now.getTime() < (parseInt(_msgTS) + 3000)) {
        popupMessage(_msg);
      }
    } else {
      // popupMessage(_msg);
    }
    //console.log("now: " + now.getTime() + now + " || msg timestamp: " + _msgTS + (new Date(parseInt(_msgTS))));
  }
};

var globalErrorCaptureAPIHandler = function(XHR, options, thrownError) {
  if ( console && console.log ) {
    console.log("fn sendConfirmForm XHR.status: " + XHR.status);
    console.log("fn sendConfirmForm thrownError: " + thrownError);
  }
  var messageText = globalErrorMessageHandler(XHR);

  var url = window.location.href;
  if (url.indexOf("#") > -1) {
    url = url.substring(0, url.indexOf("#"));
  }
  if (url.indexOf("?") == -1) {
    url = url + "?";
  }
  var now = new Date();
  url = url + "&errorMsg=" + messageText + "&msgTS=" + now.getTime();
  window.location = url;
};

var globalErrorMessageHandler = function(XHR) {
  var messageText, errorResponse, key;
  messageText = $.localize("drog.default.error");
  try {
    errorResponse = JSON.parse(XHR.responseText);
  } catch (err) {
    if ( console && console.log ) {
      console.log(err.message);
    }
    return messageText;
  }

  if (XHR.status != 403 && XHR.status != 404 && errorResponse) {
    if (!errorResponse.message) {
      if (errorResponse.error_description && errorResponse.error_description.indexOf("Invalid access token") > -1) {
        messageText = $.localize('drog.error.sessionexpire.alert');
      }
    }

    if (errorResponse.params) {
      key = "human_readable:en";
      if (authenticatedInfo) {
        key = "human_readable:" + authenticatedInfo.language;
      }
      
      if (errorResponse.params[key]) {
        messageText = errorResponse.params[key];
        if (console && console.log) {
          console.log(XHR.statusText);
        }
      } else {
        messageText = $.localize('drog.default.error');
      }
    }
  }
  return messageText;
};

var globalErrorHandler = function(event, XHR, options, thrownError) {
  var messageText;
  //remove progress overlay
  window.setTimeout(function() {
    $("#ajax_overlay").fadeOut(0);
  }, 800);

  if (console && console.log) {
    console.log("fn XHR.status: " + XHR.status);
    console.log("fn thrownError: " + thrownError);
  }

  messageText = globalErrorMessageHandler(XHR);
  popupMessage(messageText);
};

$(document).ajaxError(globalErrorHandler);

var getObjectByLocale = function(ArrarList, locale) {
  var objData = [];
  if (ArrarList) {
    $.each(ArrarList, function(index, obj) {
      if (obj.locale == locale) {
        objData = obj;
      }
    });

    if (objData.length === 0 && ArrarList.length > 0) {
      objData = ArrarList[0];
    }
  }

  return objData;
};

// var isArrayContains = function(arrayObj, needle) {
//   for (var i in arrayObj) {
//     if (arrayObj[i].toLowerCase() == needle.toLowerCase()) return true;
//   }
//   return false;
// };

var checkRedirectURL = function(redirectURL) {
  var format = null;
  if ( redirectURL ) {
    if ( isUrl(redirectURL) ) {
      format = 'url';
    } else {
      redirectURL = decodeURIComponent(redirectURL);
      if ( $(redirectURL).is('form') ) {
        format = 'form';
      }
    }
  }

  return format;
};

var isUrl = function(url) {
  var regexp = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
  return regexp.test(url);
};

var overlayHandler = function(display, headerTitle, message) {
  if ( display == 'show' ) {
    

    if ( message ) {
      $('.ajax-overlay .ajax-loader').html(message);
    }

    $('.ajax-overlay').show();

  } else if ( display == 'hide' ) {
    $('.ajax-overlay').hide();
  }
};

//D-06085 HTC Phase 2 - V1,V2,V3 - Processing Payment Message
var progressOverlayText = {
  overlayContent: $.localize('drog.overlay.message.store.loading')
};

$(document).ajaxStart(function() {
  if ( paymentTransactionParameters.transactionStep == 'order-confirm' ) {
    paymentTransactionParameters.transactionStep = null;
  }
  // set overlay content in different conditions
  progressOverlayText.overlayContent = progressOverlayText.overlayContent ? progressOverlayText.overlayContent : $.localize('drog.overlay.message.store.loading');
  overlayHandler('show', null, progressOverlayText.overlayContent);
}).ajaxStop(function() {
  // init overlay content
  progressOverlayText.overlayContent = null;

  if ( paymentTransactionParameters.transactionStep == 'order-confirm' ) {
    paymentTransactionParameters.transactionStep = null;
  } else {
    overlayHandler('hide');
  }
});

// window.onload W3C cross-browser with a fallback
var addLoadEvent = function(func) {
  if (window.addEventListener)
    window.addEventListener("load", func, false);
  else if (window.attachEvent)
    window.attachEvent("onload", func);
  else { // fallback
    var oldonload = window.onload;
    window.onload = function() {
      if (oldonload) oldonload();
      func();
    };
  }
};

