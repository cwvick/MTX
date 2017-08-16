/* jshint ignore:start,-W101 */
var scopeType = "defaultPayment";
var clientType = "6ft.com";
var storeParam = {
  client: clientType,
  game: "dreadnought",
  storeVersion: "v1",
  catalog: getUrlVars().catalog ? getUrlVars().catalog : "dreadnought"
};

var validatePaymentForm, SEPAConfirmForm;
var arrPaymentGroupType = {};

var countryChangedByUser = false;

var preloadImages = function() {
  var preloadImages = document.getElementById('preloadImagesTmpl');

  var divElement = document.createElement('div');
  divElement.className = 'preload-images';
  divElement.innerHTML = preloadImages.innerText || preloadImages.textContent;

  document.body.appendChild(divElement);
};

addLoadEvent(preloadImages);

// override base setting
if(apiPath) {
  apiPath.offerUrl = function() {
    // 2016-03-21 removed attributes in offer API url
    // new onboarding clients in the future shouldn't also have these attributes set in the offer api
    // make offer API accept both priceId or offerId
    var offerAssigned = "";
    if (paymentTransactionParameters.ssoPriceId) {
      offerAssigned = '&externalPriceId=' + paymentTransactionParameters.ssoPriceId;
    } else if (paymentTransactionParameters.ssoOfferId) {
      offerAssigned = '&externalOfferId=' + paymentTransactionParameters.ssoOfferId;
    }
    return this.urlPath + config.offer_v3 + '&language=' + authenticatedInfo.language + '&country=' + authenticatedInfo.countryIdentifier + '&client=' + clientType + '&referenceId=' + getUrlVars().referenceId + '&catalog=' + storeParam.catalog + offerAssigned;
  };
  apiPath.authenticateUrl = function() {
    this.initUrlPath();
    // Pass all parameters to authenticate API
    var ssoParams = (window.location.search === "") ? "" : "&" + window.location.search.substring(1);
    var url = this.urlPath + config.auth + '?client=' + clientType + ssoParams;
    //DROG-6842 default catalog should not be passed.
    if (window.location.host !== "localhost" && ssoParams !=="" && ssoParams.indexOf('catalog') < 0) {
      //return url + '&catalog=' + storeParam.catalog;
      //for internal only
      alert('catalog.missing');
    }
    return url;
  };
}

$(function() {
  authenticate(apiPath.authenticateUrl(), {
    beforeSendCB: function(data) {
      setSsoParams();
      initUI();
      data.setRequestHeader('Accept-Language', storeLanguage);
      data.setRequestHeader('game', storeParam.game);
      data.setRequestHeader('storeVersion', storeParam.storeVersion);
    },
    successCB: function(response) {
      // DROG-6948
      $('.disclaimer').show();
      
      // DROG-6392
      //ga('create', 'UA-56967936-2', { 'userId': authenticatedInfo.access_token });
      //eCommerceDataLayer.push({'userId': authenticatedInfo.access_token});
      
      CheckState("#ProductSelection");

      $.when( loadUserMetaData() ).done(function() {
        $.when( loadMetaData(apiPath.metaUrl()) ).done(function() {
          if ( !paymentTransactionParameters.storeMaintenance ) {
            loadOfferInformation(apiPath.offerUrl());
          } else {
            CheckState("#StoreMaintenance");
          }
        });
      });
    }
  });
});

var CheckState = function(_hash) {
  if (!_hash) {
    _hash = location.hash;
  }

  hidePopupMessage();

  $('.modal').hide();
  var payment_id = paymentTransactionParameters.paymentFormId;
  switch (_hash) {
    case "#StoreMaintenance":
      if ( $('.maintenance-modal').length > 0 ) {
        $('.maintenance-modal .mainten-text').text($.localize("drog.storeMaintenance.displayValue"));
        $('.maintenance-modal').show();
        progressBarHandler('hide');
      }

      //ga('set', 'page', '/store-maintenance');
      break;
    case "#SessionExpire":
      if ( $('.session-expire-modal').length > 0 ) {
        $('.session-expire-modal .expire-text').text($.localize("drog.error.sessionexpire.alert"));
        $('.session-expire-modal').show();
        progressBarHandler('hide');
      }
      break;
    case "#ProductSelection":
    case "#PaymentSelection":      
      $('.purchase-summary-modal').show();
      progressBarHandler('step-1');
      //ga('set', 'page', '/payment-selection');
      // B-22811 6ft - v1 webstore only request - add VersaTag tracking
      if (typeof versaTagObj !== 'undefined' && versaTagObj !== null) {
        versaTagObj.generateRequest("http://www.6ft.com/store/dreadnought/billing.html");
      }
      /* eCommerceDataLayer.push({
        'event': 'checkout',
        'ecommerce': {
          'checkout': {
            'actionField': {'step': 1}
          }
        }
      }); */
      break;
    case "#ReviewYourOrder":
      $('.confirmation-modal').show();
      $('.confirmation-buttons').show();
      progressBarHandler('step-2');

      if (!$('#tos').prop('checked')) {
        $('.confirmation-modal .button.confirm').addClass('disabled');
      }
      if (paymentTransactionParameters.paymentFormId == "cpgSEPADirectDebit") {
        $(".confirmation-modal .sddMandate .mandateSignatureEmail").text(paymentTransactionParameters.SDD.emailAsSignature);       
        $(".confirmation-modal .sddMandate").show();
      } else {     
        $(".confirmation-modal .sddMandate").hide();
      }
      //ga('set', 'page', '/order-review');
      if (typeof versaTagObj !== 'undefined' && versaTagObj !== null) {
        versaTagObj.generateRequest("http://www.6ft.com/store/dreadnought/confirmation.html");
      }
      /* eCommerceDataLayer.push({
        'event': 'checkout',
        'ecommerce': {
          'checkout': {
            'actionField': {'step': 2}
          }
        }
      }); */
      break;
    case "#CompleteOrder":
      $('.modal').hide();
      if ( payment_id == "cpgKonbini" || payment_id == "cpgPayEasy" || payment_id == "cpgSevenElevenShop" ) {
          purchaseInstructionHandler();
      } 
      $('.thank-you-modal').show();
      progressBarHandler('step-3');

      if (paymentTransactionParameters.paymentFormId === "cpgSEPADirectDebit") {
        $(".thank-you-modal .sddMandate .mandateSignatureEmail").text(paymentTransactionParameters.SDD.emailAsSignature);
        $(".thank-you-modal .sddMandate").show();
      } else {     
        $(".thank-you-modal .sddMandate").hide();
      } 
      //HostAPI.complete();

      //ga('set', 'page', '/order-complete');
      /* eCommerceDataLayer.push({
        'event': 'checkout',
        'ecommerce': {
          'checkout': {
            'actionField': {'step': 3}
          }
        }
      }); */
      trackPurchaseComplete();      
      break;
  }
  // resize parent window
  // height is needed to adjust modal height
  /*var $modalVisible = $('.modal:visible');
  HostAPI.resize({
    width: $modalVisible.width(),
    height: $modalVisible.height()
  });*/
  
  //ga('send', 'pageview');
};

function loadUserMetaData() {
  return $.ajax({
    // D-06192 HTC Phase 2 - Country Detection Not Working via Admin UI / check SSO country field first
    url: apiPath.userMetaUrl() + (getUrlVars().country ? '&country=' + getUrlVars().country : '') + getHeaderParams(),
    xhrFields: {
      withCredentials: true
    },
    cache: false,
    dataType: config.default_dataType,
    jsonpCallback: "callback",
    beforeSend: setHeader
  })
  .fail(function(xhr, ajaxOptions, thrownError) {
    if ( console && console.log ) {
      console.log("url: " + apiPath.userMetaUrl());
      console.log("fn loadUserMetaData xhr.status: " + xhr.status);
      console.log("fn loadUserMetaData xhr.responseText: " + xhr.responseText);
      console.log("fn loadUserMetaData thrownError: " + thrownError);
    }
  })
  .done(function(data) {
    updateSellingEntity(data);

    if (data.address.length > 0 && typeof data.address[0].accountId !== "undefined" && data.address[0].accountId !== null) {
      bindAddressData(data.address[0]);
      $('.payment-form').data('default-address', data.address[0]);
    } else {
      // added condition when there's only email address
      if (data.address.length > 0 && typeof data.address[0].email !== "undefined" && data.address[0].email !== null) {
        paymentTransactionParameters.addressInfo.email = data.address[0].email;
        $('#email').val(data.address[0].email);
      }
    }

    if (typeof data.recurringBuyer !== "undefined") {
      paymentTransactionParameters.recurringBuyer = data.recurringBuyer;
    }

    if (typeof data.returningUserShouldEnterCVV !== "undefined") {
      paymentTransactionParameters.returningUserShouldEnterCVV = data.returningUserShouldEnterCVV;
    }

    if (typeof data.userLocalizationData !== "undefined") {
      if (typeof data.userLocalizationData.language !== "undefined") {
        authenticatedInfo.language = data.userLocalizationData.language;
      }

      // TODO testing
      // if (typeof data.userLocalizationData.countryIdentifier !== "undefined") {
      //   // DROG-6251 avoid reload offer if address.countryCode conflicts with userLocalizationData.countryIdentifier
      //   if (paymentTransactionParameters.addressInfo.countryCode && paymentTransactionParameters.addressInfo.countryCode !== '') {
      //     authenticatedInfo.countryIdentifier = paymentTransactionParameters.addressInfo.countryCode;
      //   } else {
      //     authenticatedInfo.countryIdentifier = data.userLocalizationData.countryIdentifier;
      //   }
      // }

      // D-06192 HTC Phase 2 - Country Detection Not Working via Admin UI / check SSO country field first
      if( getUrlVars().country ) {
        // already handled in setSsoParams
      } else if (typeof data.userLocalizationData.countryIdentifier !== "undefined") {
        authenticatedInfo.countryIdentifier = data.userLocalizationData.countryIdentifier;
      } else if (paymentTransactionParameters.addressInfo.countryCode && paymentTransactionParameters.addressInfo.countryCode !== '') {
        authenticatedInfo.countryIdentifier = paymentTransactionParameters.addressInfo.countryCode;
      }

      if (typeof data.userLocalizationData.currencyIdentifier !== "undefined") {
        paymentTransactionParameters.currencyIdentifier = data.userLocalizationData.currencyIdentifier;
        paymentTransactionParameters.currencySymbol = currencySymbol(paymentTransactionParameters.currencyIdentifier);
      }
    }
    
    if (data.banks && typeof data.banks !== "undefined") {
      // re-bind bank options for IBP payment
      setIBPBankOptions(data.banks);
    }

    if (data.paymentTypes.length > 0) {
      setPaymentOptions(data.paymentTypes);
    }

    // To show default payment type
    if ( !paymentTransactionParameters.hasDefaultPayment ) {
      $('#method-list').find('option').eq(1).prop('selected', true).trigger('change');
    }

    if (typeof data.storeMaintenance !== 'undefined') {
      paymentTransactionParameters.storeMaintenance = data.storeMaintenance;
    }

    DetermineErrMsg();
  });
}

function loadMetaData(url) {
  $.ajax({
    url: url,
    xhrFields: { 
      withCredentials: true 
    },
    dataType: config.default_dataType,
    jsonpCallback: "callback"
  })
  .fail(function(xhr, ajaxOptions, thrownError) {
    if (console && console.log) {
      console.log("url: " + url);
      console.log("fn loadMetaData xhr.status: " + xhr.status);
      console.log("fn loadMetaData xhr.responseText: " + xhr.responseText);
      console.log("fn loadMetaData thrownError: " + thrownError);
    }
  })
  .done(function(data) {
    metaDataHandler(data);
    bindUserData();
  });
}

function loadOfferInformation(url, callbackFn) {
  loadAjaxData(url + getHeaderParams(), {beforeSendCB: setHeader,
    successCB: function(data) {
      var isOffer = false;

      if (data.length > 0) {
        // Set currencyIdentifier to be the currency of the first offer (DROG-5407)
        var firstOffer = (data.length > 5 && paymentTransactionParameters.recurringBuyer) ? data[1] : data[0];
        if( hasValidPrice(firstOffer) ) {
          var _price = firstOffer.prices[0];
          paymentTransactionParameters.currencyIdentifier = (_price.price && typeof _price.price.isoCode !== 'undefined') ? _price.price.isoCode : _price.currency;      
          paymentTransactionParameters.currencySymbol = (_price.price && typeof _price.price.symbol !== 'undefined') ? _price.price.symbol : currencySymbol(paymentTransactionParameters.currencyIdentifier);
          
          // D-06799
          updatePaymentOptionsByCurrency('EUR', ['cpgIBP', 'cpgSEPADirectDebit']);
        }

        $.each(data, function(index, offer) {
          // show the offer which matched offerId or priceId in SSO param
          if ( matchPriceId(offer, paymentTransactionParameters.ssoPriceId) || matchOfferId(offer, paymentTransactionParameters.ssoOfferId) ) {
            isOffer = true;
            bindOfferData(offer);
          }
        });
               
        //D-06889 v1 & v2, Currencies Not Supported for CreditCard Types
        displayCreditcardLogo('unionpay', isCardTypeSupported("UNIONPAY"));
        displayCreditcardLogo('jcb', isCardTypeSupported("JCB"));
        displayCreditcardLogo('diners', isCardTypeSupported("DINERS"));
        displayCreditcardLogo('discover', isCardTypeSupported("DISCOVER"));
      } 

      if (!isOffer) {
        paymentTransactionParameters.selectedOffer = null;
        displayNoOfferMsg();
      }

      if (typeof callbackFn === 'function') {
        callbackFn();
      }
    }
  });
}

function isUnionpaySupported() {
  //D-06533 6ft - UnionPay Not Detected for v2, probably v1 too
  var _supportedUnionpay = false;
  if(unionpaySupportedCurrencies) {
    var defaultCurrencies = ['USD','EUR','HKD','CNY'];
    unionpaySupportedCurrencies = defaultCurrencies.concat(unionpaySupportedCurrencies);
    
    $.each(unionpaySupportedCurrencies, function(index, _currency) {
      if(paymentTransactionParameters.currencyIdentifier === _currency) {
        _supportedUnionpay = true;
      }
    });
  }
  return _supportedUnionpay;
}

//D-06889 v1 & v2, Currencies Not Supported for CreditCard Types
var cardSupportList = {
  "JCB" : {
    "notAllowedCurrencies" : ['CHF', 'SEK', 'PLN' ]
  },
  "DINERS" : {
    "notAllowedCurrencies" : ['CHF', 'SEK', 'PLN' ]
  },
  "DISCOVER" : {
    "notAllowedCurrencies" : ['CHF', 'SEK', 'PLN' ]
  }
};

var isCardTypeSupported = function(ccType) {
  //D-06533 6ft - UnionPay Not Detected for v2, probably v1 too
  ccType = ccType.toUpperCase();
  var _supported = true;

  if(ccType == 'UNIONPAY') {
    _supported = isUnionpaySupported();
  } else {
    if (cardSupportList && cardSupportList[ccType] && typeof cardSupportList[ccType].notAllowedCurrencies !== 'undefined') {
      if (cardSupportList[ccType].notAllowedCurrencies.indexOf(paymentTransactionParameters.currencyIdentifier) > -1) {
        _supported = false;
      }
    }
  }
  return _supported;
};

function displayCreditcardLogo(type, show){
  if(show){
     $('.paymentMethodBox[for=cpgCreditCard] .creditcard-type' + '.' + type).show();
  } else {
     $('.paymentMethodBox[for=cpgCreditCard] .creditcard-type' + '.' + type).hide();
  }
}

function updateSellingEntity(data) {
  if (data && data.sellingEntity) {
    // change selling entity in the footer
    $(".sellingEntity").text(data.sellingEntity.footer);

    paymentTransactionParameters.sellingEntity = data.sellingEntity;
  }
}

function displayTermsAndConditionLinks(terms) {
  if (terms) {
    if ( terms.termsAndConditionsId !== null ) {
      paymentTransactionParameters.termsAndConditionsId = terms.termsAndConditionsId;
    }
    $("a.privacyPolicy").attr("href", decodeURIComponent(terms.privacyPolicyLink));
    $("a.termsSales").attr("href", decodeURIComponent(terms.termsOfSaleLink));
    $("a.legalNotice").attr("href", decodeURIComponent(terms.legalNoticeLink));
  }
}

function bindUserData() {
  // Bind user data
  if ( !countryChangedByUser ) {
    var address = paymentTransactionParameters.addressInfo;
    if (address.accountId) {
      $("#firstname").val(address.firstName);
      $("#lastname").val(address.lastName);
      $('#address').val(address.street1 ? address.street1 : "");
      $('#addressExtra').val(address.street2 ? address.street2 : "");
      $('#zipCode').val(address.zipCode);
      $('#city').val(address.city);
      $('#email').val(address.email);

      // To bind user's country and state 
      if (address.countryCode) {
        $('#country').val(address.countryCode).trigger('triggeredChange');
        if (address.stateCode) {
          $('#state').val(address.stateCode);
          var stateData = $('#state').data('states');
        } else if (address.stateText) {
          $('#state').val($('#state option[data-text="' + address.stateText + '"]').val());
        }
      }
      

    } else if ( authenticatedInfo.countryIdentifier ) {
      $('#country').val(authenticatedInfo.countryIdentifier).trigger('triggeredChange');
    }
  }

  // bind user's credit card data
  var creditCard = paymentTransactionParameters.creditCard;
  if (creditCard.creditCardExternalId) {
    $('#cardExpirationMonth').val(parseInt(creditCard.expiresMonthForUI));
    $('#cardExpirationYear').val(parseInt(creditCard.expiresYearForUI));
    $('#cardNumber').val("****-****-****-" + creditCard.lastFourDigits);
    $('#cardNumber').rules('remove', 'supportedCard');

    var CCType = creditCard.type;   
    $('.paymentMethodBox .creditcard-type.' + CCType.toLowerCase() + ' .paymentName-img-selectedPart').html('<span class="icon ' + CCType.toLowerCase() + '-icon selectUI"></span>');
    
    var $cardSecurityCode = $('#cardSecurityCode');
    securityCodeLength(CCType);

    if (paymentTransactionParameters.returningUserShouldEnterCVV) {
      $cardSecurityCode.val('');
      if ( !$cardSecurityCode.rules()['number'] ) {
        $cardSecurityCode.rules('add',{ number:true });
      }
    } else {
      var starLength = (CCType == 'AMEX')? '****' : '***';
      $cardSecurityCode.val(starLength);
      $cardSecurityCode.rules('remove', 'number');
    }

  }
  
  var sddForm = paymentTransactionParameters.SDD;
  if (sddForm.bankBillingInfoExternalId) {
    $("#sdd_bankRoutingCode").val(sddForm.bankBranchNumber);
    $("#sdd_bankAccountNumber").val("******" + sddForm.displayValue);
    $('#sdd_bankAccountNumber').rules('remove', 'sepa_validAccountNumber');
    $(".save input[for=cpgSEPADirectDebit]").attr("checked", "checked");
  }
  
  var ibpForm = paymentTransactionParameters.bankBilling;
  if (ibpForm.bankBillingInfoExternalId) {
    if ($('#ibpBankName option[bank-id=' + ibpForm.bankBranchNumber + ']').length) {
      $('#ibpBankName option[bank-id=' + ibpForm.bankBranchNumber + ']').prop('selected', true).trigger('change');
      $(".save input[for=cpgIBP]").attr("checked", "checked");
    }
  }

  // var elvForm = paymentTransactionParameters.ELV;
  // if (elvForm.bankBillingInfoExternalId) {
  //   $("#bankName").val(elvForm.bankName);
  //   $("#bankRoutingCode").val(elvForm.bankBranchNumber);
  //   $("#bankAccountHolder").val(elvForm.bankAccountHolder);
  //   $("#bankAccountNumber").val("******" + elvForm.displayValue);
  //   $('#bankAccountNumber').rules('remove', 'number');
  //   $(".save input[for=cpgELV]").attr("checked", "checked");
  // }

}

var initUI = function() {
  bindEventHandler();
  formValidator();

  paymentTransactionParameters.paymentFormId = null;
  
  var _expiresYear = $("#cardExpirationYear");
  _expiresYear.empty();
  var year = new Date().getFullYear();
  for (var i = 0; i <= 24; i++) {
    _expiresYear.append($("<option></option>").text(year + i).val(year + i));
  }

  var month = new Date().getMonth() + 1;
  $('#cardExpirationMonth').val(month);
  
  if( internetExplorer9andLess() ) {
    $('.ajax-overlay').find('.spinner').addClass('nocssanimation');
  }
  
  //adjustment Price Detail UI for diffrent browser and mobile browser
  $(window).bind("load resize", function(){
    var browserWidth = $(window).width();
    var is_safari = navigator.userAgent.indexOf("Safari") > -1;
    var isMobile = {    
      iOS: function() {
          return navigator.userAgent.match(/iPhone|iPod/i);
      },
      Android: function() {
          return navigator.userAgent.match(/Android/i);
      }
    };
    if(isMobile.iOS() && browserWidth < 500) { 
      $('.pure-u-1').css('min-width', '320px');
      $('.pure-g').css('-webkit-flex-flow', 'row wrap');
    } else if(isMobile.Android() && browserWidth < 500) {
      $('.pure-u-1').css('width', '100%');
      $('.pure-g').css('-webkit-flex-flow', 'row wrap');
    } else if (is_safari){
      $('.pure-g').css('-webkit-flex-flow', 'initial');
    } else {
      $('.pure-g').css('-webkit-flex-flow', 'row wrap');
    }
  });
};

var supportedEvents = { 
  complete: "complete", 
  backtostore: "finish", 
  close: "close", 
  resize: "resize", 
  error: "error", 
  getorder: "get_order",
  openlink: "openlink"
};

(function() {
  "use strict";

  // referrer will always be the parent frame
  var allowedParentOrigins = allowedHostAPIOrigins,
  parents = [
    "https://cdn.fatfoogoo.com",
    "https://6ft.qa.pok.fatfoogoo.com"
  ];
  allowedParentOrigins = parents.concat( allowedParentOrigins ); 
  
  var parentOrigin = document.referrer,
  whitelistedReferrer = allowedParentOrigins.some(function(allowedOrigin) {
    if(parentOrigin.indexOf(allowedOrigin + "/") !== -1) {
      parentOrigin = allowedOrigin;
      return true;
    }
  }),
  callbacks = {};

  function messageParent(command, data) { 
    if (!whitelistedReferrer) {
      if ( console && console.log ) {
        console.log("Message to parent blocked. Non-whitelisted origin: " + parentOrigin);
      }
      return;
    }
    //console.log("AllowedOrigins: " + allowedParentOrigins + "; Referrer: " + document.referrer);

    data = data || {};

    if(data) {
        data.action = command;
    }

    window.parent.postMessage(JSON.stringify(data), parentOrigin);
  }
  
  window.HostAPI = {
    complete : function() {
      messageParent(supportedEvents.complete);
    },
    backtostore : function() {
      messageParent(supportedEvents.backtostore);
    },
    close : function() {
      messageParent(supportedEvents.close);
    },
    resize : function(obj) {
      messageParent(supportedEvents.resize, obj);
    },
    openlink : function(_url) {
      messageParent(supportedEvents.openlink, { url : _url });
    }
  };
}());

var expireTimer;

function setHeader(xhr) {
  xhr.setRequestHeader('Authorization', 'Bearer ' + authenticatedInfo.access_token);
  xhr.setRequestHeader('Accept-Language', storeLanguage);
  xhr.setRequestHeader('game', storeParam.game);
  xhr.setRequestHeader('storeVersion', storeParam.storeVersion);
  // Session expired in 5 mins 5*60=300s (default)
  clearInterval(expireTimer);
  var expires_in = authenticatedInfo.expires_in || 300;
  expireTimer = setInterval(function(){CheckState("#SessionExpire");}, expires_in*1000);
  if ( console && console.log ) {
    //console.log("Reset expire timer. Expires in " + expires_in + " seconds.");
  }
}

var internetExplorer9andLess = function() {
  return /MSIE\s/.test(navigator.userAgent) && parseFloat(navigator.appVersion.split("MSIE")[1]) < 10;
};

var getHeaderParams = function() {
  var headerParams = '';
  if ( internetExplorer9andLess() ) {
    headerParams = '&access_token=' + authenticatedInfo.access_token + '&accept_language=' + storeLanguage + '&game=' + storeParam.game + '&storeVersion=' + storeParam.storeVersion;
  }
  return headerParams;
};

/**
 * IE9 and IE8 support CORS POST request only with 'text/plain' content type
 * @returns {string}
 */
var getContentType = function() {
  var contentType = 'application/json';
  if (internetExplorer9andLess()) {
    contentType = 'text/plain';
  }
  return contentType;
};

var bindEventHandler = function() {
  var $document = $(document);

  $document.on('click', '#payment-form button.next', function(event) {
    event.preventDefault();

    if (!$(this).hasClass('disabled')) {
      //ga('send', 'event', 'button', 'click', 'btn-continue');
      //eCommerceDataLayer.push({'button-click': 'btn-continue'});
      sendBillingForm();
    }
  });

  // NOTE: keep for SEPA payment [Vick]
  // $(document).on('click', '#agreeSEPA', function(event) {
  //   $(this).removeClass('invalid').toggleClass('checked');

  //   if ($(this).hasClass("checked")) {
  //     $(this).prop("checked", true);
  //   } else {
  //     $(this).removeAttr("checked");
  //   }

  //   $('#sddMandateForm').submit();
  // });   

  $document.on('click', '.confirmation-buttons .confirm', function(event) {
    event.preventDefault();
    if (!$('#tos').prop('checked')) {
      popupMessage($.localize("drog.terms.not.accepted"));
      $('#tos').addClass('invalid');
    } else {
      //ga('send', 'event', 'button', 'click', 'btn-confirmpurchase');
      //eCommerceDataLayer.push({'button-click': 'btn-confirmpurchase'});
      sendConfirmForm();
    }
  });

  $document.on('click', '.btn-edit', function(event) {
    event.preventDefault();
    //ga('send', 'event', 'button', 'click', 'btn-change');
    CheckState('#PaymentSelection');
  });

  $document.on('click', '.closePopup', function(event) {
    event.preventDefault();
    hidePopupMessage();
  });

  $document.on('click', '.follow-up-link', function(event) {
    event.preventDefault();
    var action = $(this).data('action');

    if (action) {
      followUpAction(action);
    }
  });

  // NOTE: keep for delete store payment feature [Vick]
  // $(document).on('click', '.btn_removePayment', function(event) {
  //   event.preventDefault();
  //   removeStoredPaymentOption();
  // });
  
  //B-19032 B-20779 konibi show closest store phone
  $document.on('change blur', '#phone', function (event) {
    if ( !$(this).hasClass('invalid') ) {
      paymentTransactionParameters.addressInfo.phone = $(this).val().trim();
    }
  });
  
  $document.on('change', 'input:radio[name="konbini_stores"]', function() {
    if ( isPhoneNumShow(paymentTransactionParameters.paymentFormId) ) {
      $('#phone').closest('.inputpart').show();
    } else {
      $('#phone').closest('.inputpart').hide();
    }
  });
  
  $document.on('click', '.modal .close', function(event) {
    event.preventDefault();
    //TODO: postMessage function, need testing 
    HostAPI.close();
  });

  $document.on('click', '.modal .backToStore', function(event) {
    event.preventDefault();
    //TODO: postMessage function, need testing
    HostAPI.backtostore();
  });

  $document.on('click', '.modal .backStore', function(event) {
    event.preventDefault();
    window.top.location.href = replaceStringArgs($.localize('drog.back.store.link'), [storeLanguage]);
  });
  
  /*$document.on('click', 'a', function(event) {
    event.preventDefault();

    var _url = $(this).attr('href');

    if (_url) {
      //TODO: postMessage function, need testing
      HostAPI.openlink(_url);
    }
  });*/

  $("#payment-form, #sddMandateForm").submit(function() {
    return false;
  });

  $document.on('change', 'input[type="checkbox"]', function(event) {
    event.preventDefault();
    if ($(this).prop('checked')) {
      $(this).addClass('checked');
    } else {
      $(this).removeClass('checked');
    }    
  });

  $document.on('change', '#tos', function(event) {
    event.preventDefault();
    $(this).removeClass('invalid');

    if ($(this).prop('checked')) {
      hidePopupMessage();
      $('.confirmation-modal .button.confirm').removeClass('disabled');
    } else {
      $('.confirmation-modal .button.confirm').addClass('disabled');
    }

    if ( paymentTransactionParameters.paymentFormId == 'cpgSEPADirectDebit' ) {
      $("#sddMandateForm").submit();
    }
  });

  $document.on('change', '#state', function(event) {
    event.preventDefault();

    var _newStateCode = $(this).val();
    var paymentOption = $('#method-list').find('option:selected');
    var pmtData = paymentOption.data('info');
    if( pmtData && typeof pmtData.addressDetails !== 'undefined' ) {
      if(pmtData.addressDetails && typeof pmtData.addressDetails.stateCode !== 'undefined') {
        pmtData.addressDetails.stateCode = _newStateCode;
      }
    }
    paymentOption.data('info', pmtData); 
  });
  
  $document.on('change', '#country', function(event) {
    event.preventDefault();
    countryChangedByUser = true;
    $(this).trigger('triggeredChange');
  });

  $document.on('triggeredChange', '#country', function(event) {
    event.preventDefault();
    countryDropListHandler();

    var countryCode = $(this).val();

    if (countryCode === 'USA' || countryCode === '') {
      $('#zipCode').rules('remove', 'forZipFilter');

      if (!$('#zipCode').rules().forUSZipFilter) {
        $('#zipCode').rules('add', {
          forUSZipFilter: true
        });
      }
      //D-07974 6ft - dreadnought - T&Cs not automatically opted in for US customers
      $('#tos').prop('checked', true).trigger('change');

    } else {
      $('#zipCode').rules('remove', 'forUSZipFilter');

      if (!$('#zipCode').rules().forZipFilter) {
        $('#zipCode').rules('add', {
          forZipFilter: true
        });
      }

      $('#tos').prop('checked', false).trigger('change');
    }

    if (countryCode && countryCode != authenticatedInfo.countryIdentifier) {
      authenticatedInfo.countryIdentifier = countryCode;

      // update Terms of Sale link by countryId
      loadAjaxData(apiPath.termsLink(), {
        successCB: function(data) {
          // terms and conditions link
          var terms = data.termsConditions;
          paymentTransactionParameters.terms = terms;
          displayTermsAndConditionLinks(terms);
        }
      });

      // refresh offers and update payment forms
      loadOfferInformation(apiPath.offerUrl(), fn_reloadUserMeta);

      // DROG-6569 - if user changes country, address details get deleted so commented this.
      if (paymentTransactionParameters.addressInfo.countryCode && countryCode == paymentTransactionParameters.addressInfo.countryCode) {
        // the same country, rebind user data
        bindUserData();
      } else {
        // reset address info only when input value is the same as pre-stored data
        var address = paymentTransactionParameters.addressInfo;

        if ($("#address").val() == address.street1) {
          $('#address').val('');
        }

        if ($("#addressExtra").val() == address.street2) {
          $('#addressExtra').val('');
        }

        if ($("#zipCode").val() == address.zipCode) {
          $('#zipCode').val('');
        }

        if ($("#city").val() == address.city) {
          $('#city').val('');
        }

      }

    }

    // NOTE: keep for ELV payment [Vick]
    // if (countryCode == 'AUT') {
    //   $('#bankAccountNumber').rules('remove', 'maxlength');
    //   $('#bankAccountNumber').rules('add', {
    //     maxlength: 11
    //   });
    //   $('#bankRoutingCode').rules('remove', 'maxlength');
    //   $('#bankRoutingCode').rules('add', {
    //     maxlength: 5
    //   });
    //   $('#dr_ELVForm .routing').show();
    // }
    // if (countryCode == 'DEU') {
    //   $('#bankAccountNumber').rules('remove', 'maxlength');
    //   $('#bankAccountNumber').rules('add', {
    //     maxlength: 12
    //   });
    //   $('#bankRoutingCode').rules('remove', 'maxlength');
    //   $('#bankRoutingCode').rules('add', {
    //     maxlength: 8
    //   });
    //   $('#dr_ELVForm .routing').show();
    // }
    // if (countryCode == 'NLD') {
    //   $('#bankAccountNumber').rules('remove', 'maxlength');
    //   $('#bankAccountNumber').rules('add', {
    //     maxlength: 10
    //   });
    //   $('#bankRoutingCode').rules('remove', 'maxlength');
    //   $('#dr_ELVForm .routing').hide();
    // }
  });
  
  
  $document.on('change', 'select#method-list', function(event) {
    event.preventDefault();
    $('.paymentMethodBox').hide();
    
    var payment_id = $(this).val();
    var click = false;
    var $paysafecard_payment = $(this).find('option[for=cpgPaySafeCard]');
    
    if (payment_id) {
      paymentTransactionParameters.paymentFormId = payment_id;
      var _selectedMethodBox = $('.paymentMethodBox[for*="' + payment_id + '"]');

      var payment_name = $(this).find('option:selected').data('name');
      _selectedMethodBox.show().find('.payment-name').html(payment_name);
      _selectedMethodBox.show().find('.paymentName-img').html('<span class="icon ' + payment_id.substring(3).toLowerCase() + '-icon"></span>');
      
      $('#payment-form').attr('for', payment_id).find('.payment-buttons').addClass(payment_id);

      var paymentOption = $(this).find('option:selected').data('info');
      bindPaymentData(paymentOption);

      var addressDetails = paymentOption.addressDetails ? paymentOption.addressDetails : $('.payment-form').data('default-address');
      if ( addressDetails ) {
        bindAddressData(addressDetails);
      } 
            
      // NOTE: keep for multiple payment forms [Vick]
      // resetPaymentFormInput();
      bindUserData();
     
      /*if ( $('#phone').length > 0 ) {
        $('#phone').closest('.inputpart').remove();
      }
      if ( payment_id == 'cpgPayEasy' || payment_id == 'cpgKonbini' ) {
        var input_content = '<div class="column left-column inputpart">' +
                  '<label>' +
                  $.localize('drog.address.phone.number') +  
                  '</label>' +
                  '<div class="field-group">' +                   
                    '<input type="text" class="field xxlarge-field" name="phone" id="phone" value="">' +
                  '</div>' +
                '</div>';
        _selectedMethodBox.append(input_content);
        $('#phone').val(paymentTransactionParameters.addressInfo.phone).attr('placeholder', $.localize('drog.address.phone.number'));
        if ( !isPhoneNumShow(payment_id) ) {
          $('#phone').closest('.inputpart').hide();
        }
      } */

      var $saveInfo = $(".save input[for=" + payment_id + "]");
      // Hide saveinfo by default and only show for allowed payment methods
      if ( payment_id == 'cpgPayPalPreApproved' || payment_id == 'cpgPayPal' ) {        
        $saveInfo.parent('label').show().find('.saveText').html($.localize('drog.text.payment.saveinfo.paypal'));
      } else if ( payment_id == 'cpgCreditCard' || payment_id == 'cpgIBP' || payment_id == 'cpgSEPADirectDebit' ) {
        $saveInfo.parent('label').show().find('.saveText').html($.localize('drog.text.payment.saveinfo'));
      } else {
        $saveInfo.parent('label').hide();
      }
      if (isStoredPaymentForm(paymentOption)) {
        $saveInfo.prop('checked', true).trigger('change');
      } else {
        $saveInfo.prop('checked', false).trigger('change');
      }
      
      // NOTE: keep for multiple payment forms [Vick]
      // deleteBtnHandler();

      if ($('.purchase-summary-modal .button.next').hasClass('disabled')) {
        $('#payment-form').submit();
      }

      /*var $modalVisible = $('.modal:visible');
      HostAPI.resize({
        width: $modalVisible.width(),
        height: $modalVisible.height()
      });*/
      if ( payment_id != 'cpgCreditCard' ) {
        $('.payment-form .paymentName-img').html('<span class="icon ' + payment_id.substring(3).toLowerCase() + '-icon"></span>');
      }
    }
  });

  $document.on('focus', '#cardNumber', function(event) {
    event.preventDefault();
    if ( $(this).val().indexOf("*") != -1 ) {
      $('#cardNumber, #cardSecurityCode, #cardExpirationMonth, #cardExpirationYear, #nameOnCard').val('');
      $(".save input[for=cpgCreditCard]").prop('checked', false).trigger('change');
      $(this).parent().find('.lock-icon').hide();

      if ( !$(this).rules().supportedCard ){
        $(this).rules('add',{ supportedCard:true });
      }
    }
  });

  // NOTE: keep for SEPA payment [Vick]
  $document.on('focus', '#sdd_bankRoutingCode, #sdd_bankAccountNumber', function(event) {
    event.preventDefault();
    if ($("#sdd_bankAccountNumber").val().indexOf("*") != -1) {
      $('#sdd_bankRoutingCode, #sdd_bankAccountNumber').val('');

      $('#sdd_bankAccountNumber').rules('add', {
        sepa_validAccountNumber: true
      });

      paymentTransactionParameters.SDD.bankBillingInfoExternalId = null;
      $("#payment-form").submit();
    }
  });

  $document.on('keyup', '#cardNumber', function(event) {
    event.preventDefault();
    var $cardNum = $('#cardNumber');
 
    if ($(this).val().indexOf("****") != -1) {
      $cardNum.rules('remove', 'supportedCard');
    } else {
      var cNumber = $(this).val().split("-").join(""); // remove hyphens

      if (!$cardNum.rules().supportedCard) {
        $cardNum.rules('add', {
          supportedCard: true
        });
      }

      // Replace all letters, symbols except numbers
      // cNumber = cNumber.replace(/\D+/g, '');

      // $cardNum.val($cardNum.val().replace(/^([0-9]{4}-){3}[0-9]{5}$/, ''));

      // if (cNumber.length > 0) {
      //   var cNumberWithHyphen = cNumber.match(new RegExp('.{1,4}', 'g')).join("-");
      //   $(this).val(cNumberWithHyphen);
      // } else {
      //   $(this).val('');
      // }

      getCreditCardType(cNumber);
    }
  });

  $document.on('change', '#cardSecurityCode', function(event) {
    event.preventDefault();
    var $cardSecurityCode = $('#cardSecurityCode');
    if ( $(this).val().indexOf("***") != -1 ) {
      $cardSecurityCode.rules('remove','number');
    } else {
      if ( !$cardSecurityCode.rules()['number'] ){
        $cardSecurityCode.rules('add',{ number:true });
        $cardSecurityCode.val($cardSecurityCode.val().replace(/[^0-9]/g, ''));
      }
    }
  });

  // $document.on('keydown', '#cardNumber', function(event) {
  //   if (event.keyCode != 229) {
  //     // Allow: backspace, delete, tab, escape, and enter
  //     if (event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 ||
  //       // Allow: Ctrl+A
  //       (event.keyCode == 65 && event.ctrlKey === true) ||
  //       // Allow: home, end, left, right
  //       (event.keyCode >= 35 && event.keyCode <= 39)) {
  //       // let it happen, don't do anything
  //       return;
  //     } else {
  //       // Ensure that it is a number and stop the keypress
  //       if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 95 || event.keyCode > 105)) {
  //         event.preventDefault();
  //       }
  //     }
  //   }
  // });

  $document.on('blur', '#cardNumber', function(event) {
    var cardType = getCreditCardType($("#cardNumber").val().split("-").join(""));
    var creditCard = paymentTransactionParameters.creditCard;
    var CCType = creditCard.type;
    $('.paymentMethodBox .creditcard-type').removeClass('selectUI');
    $('.paymentMethodBox .paymentName-img-selectedPart').empty();
    if (cardType && cardType != 'unknown') {
        $('.paymentMethodBox .creditcard-type.' + cardType.toLowerCase()).addClass('selectUI');
        $('.paymentMethodBox .creditcard-type.' + cardType.toLowerCase() + ' .paymentName-img-selectedPart').html('<span class="icon ' + CCType.toLowerCase() + '-icon selectUI"></span>');   
    } 
  });

  $document.on('blur', '#cardExpirationYear', function(event) {
    if ($(this).val().length === 2) {
      $(this).val("20" + $(this).val());
      $(this).trigger('keyup');
    }
  });

  // DROG-6911 disable right click
  $('body')[0].oncontextmenu = function() {
    return false;
  };
};

var bindOfferData = function(selectedOffer) {
  paymentTransactionParameters.selectedOffer = selectedOffer;
  paymentTransactionParameters.offerId = selectedOffer.id;

  var _price = selectedOffer.prices[0];
  paymentTransactionParameters.priceId = _price.id;
  paymentTransactionParameters.currencyIdentifier = (_price.price && typeof _price.price.isoCode !== 'undefined') ? _price.price.isoCode : _price.currency;
  paymentTransactionParameters.currencySymbol = (_price.price && typeof _price.price.symbol !== 'undefined') ? _price.price.symbol : currencySymbol(paymentTransactionParameters.currencyIdentifier);

  //display offer summary in purchase-summary-modal
  var offerItem = selectedOffer.items[0];
  var selectedOfferItemDesc = getObjectByLocale(offerItem.descriptions, storeLanguage);
  
  var $cartSummary = $('.shopping-cart');
  $cartSummary.find('.cart-product-name').html(selectedOfferItemDesc['name']);
  $cartSummary.find('.cart-product-description').html(selectedOfferItemDesc['short']);
  
  var $productSummary = $('.purchase-summary-modal .cart-summary-table');
  $productSummary.find('.cart-subTotal').html(formatedPrice(_price));
  $productSummary.find('.cart-product-name').html(selectedOfferItemDesc['name']);
  
  // B-23211 6ft - Request to add Google Analytics Tracking to the V1 store
  // setup trackProduct object for tracking
  var _amount = (_price.price && typeof _price.price.decimalAmount !== 'undefined') ? (_price.price.decimalAmount) : '';
  trackProduct = {
    'name': '' + selectedOfferItemDesc['name'],
    'id': '' + selectedOffer.id,
    'price': '' + _amount,
    'currency': paymentTransactionParameters.currencyIdentifier,
    'brand': storeParam.game,
    'category': storeParam.catalog,
    'variant': '',
    'quantity': 1
  };

  checkCampaignOffer();
};

var checkCampaignOffer = function() {
  // B-24925 6ft - Add support to Campaign Functionality
  // check campaign offers, and update discount price
  if(paymentTransactionParameters.externalCampaignId) {
   loadAjaxData(apiPath.campaignsOfferUrl(), {successCB: function(data) {
     if(data.offerList && data.offerList.length > 0) {
        $.each(data.offerList, function(index, offer) {
          if( offer.id === paymentTransactionParameters.offerId ) {
            if(offer.prices && offer.prices.length > 0) {
              // find discount price
              $.each(offer.prices, function(index, price) {
                if(price.id === paymentTransactionParameters.priceId) {
                  // TODO: This part needs to be updated for different store UI
                  //TODO: find the Price data binding from
                  // update price
                  $('.shopping-cart').find('.cart-subTotal, .cart-total').html( formatedPrice(price) );
                  return false;
                }
              });
             }
           }  
        });
      }
    }});
  }
 };

var countryDropListHandler = function() {
  $('.state-column, .city-column').addClass('noState');
  $('#state').empty();
  $('.city-column').removeClass('column');

  var statesList = $('#country option:selected').data('states');
  if ( statesList && statesList.length > 0 ) {
    var $stateSelect = $('#state');
    $.each(statesList, function(index, state) {
      var shortDescription = state.shortDescription;
      var abbreviation = (shortDescription.indexOf('-') > -1) ? shortDescription.split('-')[1] : shortDescription;

      $stateSelect.append(
        $('<option></option>').val(shortDescription).html(abbreviation).attr('data-text', state.localizedName)
      );
    });

    $('.state-column, .city-column').removeClass('noState');
    $('.city-column').addClass('column');
  }
};

function sendBillingForm() {

  $('#payment-form').submit();

  if ( validatePaymentForm.numberOfInvalids() ) {
    popupMessage($.localize('drog.error.validation.alert'));
  } else {

    // B-20779 SUPPORT - Payment Method Setup for v1, v2 and v3
    // TODO: [Lego] If saveinfo checked for PP --> cpgPayPalPreApproved, otherwise regular PP --> cpgPayPal
    // if (paymentTransactionParameters.paymentFormId == 'cpgPayPalPreApproved' || paymentTransactionParameters.paymentFormId == 'cpgPayPal' ) {
    //   var $saveInfo = $('#saveInfo');
    //   if( $saveInfo.prop('checked') ) {
    //     paymentTransactionParameters.paymentFormId = 'cpgPayPalPreApproved';

    //     if (!arrPaymentGroupType['cpgPayPalPreApproved']) {
    //       arrPaymentGroupType['cpgPayPalPreApproved'] = arrPaymentGroupType['cpgPayPal'] || 'newWindow';
    //     }
    //   } else {
    //     paymentTransactionParameters.paymentFormId = 'cpgPayPal';

    //     if (!arrPaymentGroupType['cpgPayPal']) {
    //       arrPaymentGroupType['cpgPayPal'] = arrPaymentGroupType['cpgPayPalPreApproved'] || 'newWindow';
    //     }
    //   }
    // }

    var payment_id = paymentTransactionParameters.paymentFormId;
    var billingdata = getBillingData(payment_id);

    //ga("send", "event", "payment", "click", payment_id);
    /* eCommerceDataLayer.push({
      'event': 'checkoutOption',
      'ecommerce': {
        'checkout_option': {
          'actionField': {'step': 1, 'option': payment_id}
        }
      }
    }); */

    // set overlay content in different conditions
    progressOverlayText.overlayContent = $.localize('drog.overlay.message.order.reviewing');

    // STORE PAYMENT METHOD call
    $.ajax({
      type: config.debug ? "GET" : "POST",
      url: apiPath.paymentUpdateUrl() + getHeaderParams(),
      xhrFields: { 
        withCredentials: true 
      },
      dataType: config.default_dataType,
      contentType: getContentType(),
      jsonpCallback: "callback",
      data: JSON.stringify(billingdata),
      beforeSend : setHeader,
      error: function (xhr, ajaxOptions, thrownError) {
        if ( console && console.log ) {
          console.log("url: " + apiPath.paymentUpdateUrl());
          console.log("fn sendBillingForm xhr.status: " + xhr.status);
          console.log("fn sendBillingForm xhr.responseText: " + xhr.responseText);
          console.log("fn sendBillingForm thrownError: " + thrownError);
        }
      },
      success: function (data) {
        // FOR TESTING
        // console.log('payment update API call');
        // console.log(data);

        $('.terms-of-service .seller-name').text(paymentTransactionParameters.sellingEntity.text);
        updateAddress(data.modifiedAddress);
        paymentTransactionParameters.addressId = data.addressId;
        paymentTransactionParameters.creditCardId = data.creditCardId;

        if (typeof data.referenceBillingInfoId != 'undefined' && payment_id == 'cpgPayPalPreApproved') {
          paymentTransactionParameters.referenceBillingInfoId = data.referenceBillingInfoId;
        }

        // NOTE: keep for other payment [Vick]
        if (typeof data.bankBillingInfoId != 'undefined' && (payment_id == 'cpgELV' || payment_id == 'cpgSEPADirectDebit' || payment_id == 'cpgIBP' || payment_id == 'cpgYandexMoney')) {
          paymentTransactionParameters.bankBillingInfoId = data.bankBillingInfoId;
        }
        if (typeof data.referenceBillingInfoId != 'undefined' && payment_id == 'cpgKonbini') {
          paymentTransactionParameters.referenceBillingInfoId = data.referenceBillingInfoId;
          $('input[name="konbini_stores"]').not(':checked').closest('label').hide();
        }
        if (typeof data.referenceBillingInfoId != 'undefined' && (payment_id == 'cpgPayEasy' || payment_id == 'cpgSevenElevenShop')) {
          paymentTransactionParameters.referenceBillingInfoId = data.referenceBillingInfoId;
        }

        // NOTE: keep for SEPA payment [Vick]
        if (payment_id == 'cpgSEPADirectDebit' && typeof data.bankBillingInfoId != 'undefined') {
          if (data.mandate !== null && typeof data.mandate != 'undefined') {
            paymentTransactionParameters.SDD.mandate = data.mandate;
            $(".confirmation-modal .sddMandate").show();

            // retrieve data from mandate
            var sddMandate = $(".modal .sddMandate");
            $.each(data.mandate, function(key, value){
              //console.log(key + ": " + data.mandate[key]);
              if(sddMandate.find('.' + key).length) {
                if(data.mandate[key]) {
                  sddMandate.find('.' + key).text(data.mandate[key]);
                }
              }
            });

            if (typeof data.mandate.mandateType == 'undefined') {
              throw new Error("MandateType is empty");
            }

            if (data.mandate.mandateType == "RECURRING") {
              sddMandate.find(".mandateType").text($.localize('drog.sepa.direct.debit.mandate.type.recurring'));
              $("#sign1Id").text($.localize('drog.sepa.mandate.description.sign1.recurrent'));
              $("#sign2Id").text($.localize('drog.sepa.mandate.description.sign2.recurrent'));
              $("#rightsId").text($.localize('drog.sepa.mandate.description.rights.recurrent'));
            } else if (data.mandate.mandateType == "ONE_OFF") {
              sddMandate.find(".mandateType").text($.localize('drog.sepa.direct.debit.mandate.type.one.off'));
              $("#sign1Id").text($.localize('drog.sepa.mandate.description.sign1.one.off'));
              $("#sign2Id").text($.localize('drog.sepa.mandate.description.sign2.one.off'));
              $("#rightsId").text($.localize('drog.sepa.mandate.description.rights.one.off'));
            }

            if (typeof data.mandate.mandateState == 'undefined') {
              throw new Error("mandateState is empty");
            }

            if (data.mandate.mandateState == "SIGNED") {
              $(".confirmation-modal .sddMandate .returning").show();
              $(".confirmation-modal .sddMandate .newinfo").hide();
            } else if (data.mandate.mandateState == "NEW") {
              $(".confirmation-modal .sddMandate .returning").hide();
              $(".confirmation-modal .sddMandate .newinfo").show();
            } else {
              throw new Error("Unexpected mandateState!");
            }

            // convert format of mandateDate
            var fmt = new DateFmt();
            sddMandate.find('.mandateDate').text(fmt.format(new Date(data.mandate.mandateDate),"%d.%m.%y"));

            // to show only last 4 difits
            if (data.mandate.debtorIBAN) {
              sddMandate.find('.debtorIBAN').text("************" + data.mandate.debtorIBAN);
            }
            paymentTransactionParameters.SDD.emailAsSignature = (data.mandate.mandateType == "RECURRING" && data.mandate.mandateType == "SIGNED") ? data.mandate.mandateSignatureEmail : $("#email").val().trim();
          }
        } else {
          $(".confirmation-modal .sddMandate").hide();
        }

        sendAuthorizePayment();
      }
    });
  }

}

function updateAddress(modifiedAddress) {
  if( modifiedAddress ){
    $('#address').val(modifiedAddress.street1);
    $('#addressExtra').val(modifiedAddress.street2 ? modifiedAddress.street2 : "");
    $('#zipCode').val(modifiedAddress.zipCode);
    $('#city').val(modifiedAddress.city);
    if ( $('#state').val() ){
      $('#state').val(modifiedAddress.stateCode);
    }
  }
}

function sendAuthorizePayment() {
  var fmt = new DateFmt();
  var CONST_CURRENCY = paymentTransactionParameters.currencyIdentifier || "USD";

  // get external price point id
  var externalPricePointId = null;
  var selectedOffer = paymentTransactionParameters.selectedOffer;
  if ( selectedOffer && paymentTransactionParameters.ssoPriceId === null ) {
    for (var priceIndex in selectedOffer.prices) {
      var _price = selectedOffer.prices[priceIndex];
      if (_price.price && typeof _price.price.isoCode !== 'undefined') {
        //offer v3 format
        if (_price.price.isoCode === CONST_CURRENCY) {
          externalPricePointId = selectedOffer.prices[priceIndex].id;
        }
      } else if (_price.price && typeof _price.currency !== 'undefined') {
        if (_price.currency === CONST_CURRENCY) {
          //offer v2 format
          externalPricePointId = selectedOffer.prices[priceIndex].id;
        }
      }
    }
  }

  var confirmdata = {
    //TK-37978 Get addressId from addressInfo.id when reccurring users don't need to pass payment method call
    "addressId": paymentTransactionParameters.addressId || paymentTransactionParameters.addressInfo.id,
    "paymentType": paymentTransactionParameters.paymentFormId,
    "quantity": 1,
    "price": {
      "id": ((paymentTransactionParameters.ssoPriceId === null) ? externalPricePointId : paymentTransactionParameters.ssoPriceId) || paymentTransactionParameters.priceId
    },
    "externalTransactionId": paymentTransactionParameters.externalTransactionId,
    "externalCampaignId": paymentTransactionParameters.externalCampaignId,
    "catalogIdentifier": paymentTransactionParameters.ssoCatalogType ? paymentTransactionParameters.ssoCatalogType : storeParam.catalog
  };

  var payment_id = paymentTransactionParameters.paymentFormId;
  if ( payment_id == 'cpgCreditCard' ) {
    confirmdata.creditCardId = paymentTransactionParameters.creditCardId;
  } else if ( payment_id == 'cpgELV' || payment_id == 'cpgSEPADirectDebit' || payment_id == 'cpgIBP' || payment_id == 'cpgYandexMoney' ) {
    confirmdata.creditCardId = null;
    // TODO: TK-37978 Get bankBillingInfoId from payment selector data when reccurring users don't need to pass payment method call
    confirmdata.bankBillingInfoId = paymentTransactionParameters.bankBillingInfoId;
  } else if ( payment_id == 'cpgKonbini' || payment_id == 'cpgPayEasy' || payment_id == 'cpgSevenElevenShop' ) {
    confirmdata.referenceBillingInfoId = paymentTransactionParameters.referenceBillingInfoId;
  } else if ( payment_id == 'cpgPayPalPreApproved' ) {
    confirmdata.creditCardId = null;
    confirmdata.bankBillingInfoId = null;
    confirmdata.referenceBillingInfoId = paymentTransactionParameters.referenceBillingInfoId;
  }

  // FOR TESTING
  // console.log("authorize confirmdata");
  // console.log(confirmdata);
  
  // AUTHORIZE PAYMENT call
  $.ajax({
    type: config.debug ? "GET" : "POST",
    url: apiPath.authorizeUrl() + getHeaderParams(),
    xhrFields: { 
        withCredentials: true 
      },
    dataType: config.default_dataType,
    contentType: getContentType(),
    jsonpCallback: "callback",
    data: JSON.stringify(confirmdata),
    beforeSend: setHeader,
    error: function (xhr, ajaxOptions, thrownError) {
      if ( console && console.log ) {
        console.log("fn authenticate xhr.status: " + xhr.status);
        console.log("fn authenticate xhr.responseText: " + xhr.responseText);
        console.log("fn authenticate thrownError: " + thrownError);
      }
    },
    success: function (data) {
      // FOR TESTING
      // console.log('authorize API call');
      // console.log(data);
      var payment_id = paymentTransactionParameters.paymentFormId;
      paymentTransactionParameters.transactionId = data.transactionId;
      var offer = paymentTransactionParameters.selectedOffer;
      var offerItem = offer.items[0];
      var selectedOfferItemDesc = getObjectByLocale(offerItem.descriptions, storeLanguage);

      var $cartSummary = $('.shopping-cart');
      $cartSummary.find('.cart-product-name').html(selectedOfferItemDesc['name']);
      $cartSummary.find('.cart-product-description').html(selectedOfferItemDesc['short']);
      $cartSummary.find('.cart-subTotal').html(formatedPrice(data.amount, true, false));
      $cartSummary.find('.cart-total').html(formatedPrice(data.amountTotal, true, false));

      // D-06225 SUPPPORT - HTC Phase 2 - Tax vs Tax Incl Based on Currency
      paymentTransactionParameters.taxOnTop = data.taxOnTop;
      if (!paymentTransactionParameters.taxOnTop) {
        //D-06278 SUPPORT - HTC Phase 2 - "amount" is different on API response
        $cartSummary.find('.cart-subTotal').html(formatedPrice(data.amountTotal, true, false));
        $cartSummary.find('.cart-vat-row').hide();
      } else {
        var priceTax = formatedPrice(data.tax, true, false);
        $cartSummary.find('.cart-vat').html(priceTax);
        $cartSummary.find('.cart-vat-row').show();

        //determine tax tile VAT cs TAX
        var vatCurrencyList = ['GBP', 'EUR', 'PLN', 'CHF'];
        if( vatCurrencyList.indexOf(paymentTransactionParameters.currencyIdentifier) > -1 ) {
          $cartSummary.find('.cart-vat-title').html($.localize('drog.confirm.payment.price.vat'));
        } else {
          $cartSummary.find('.cart-vat-title').html($.localize('drog.confirm.payment.price.tax'));
        }
      }
      $('.paymentName-number').html(paymentTransactionParameters.transactionId);
      //var rightNow = new Date();
      //var currentDate = rightNow.toISOString().slice(0,10).replace(/-/g,"/");
     
      // B-22810 - 6ft - v1 and v2 stores - update date format on de language only to be DD.MM.YYYY
      Date.prototype.OrderDate = function() {                                        
        var yyyy = this.getFullYear().toString();                                    
        var mm = (this.getMonth()+1).toString();         
        var dd  = this.getDate().toString(); 
        var yearFirst = yyyy + '.' + (mm[1]?mm:"0"+mm[0]) + '.' + (dd[1]?dd:"0"+dd[0]);
        var dateFirst = (dd[1]?dd:"0"+dd[0]) + '.' + (mm[1]?mm:"0"+mm[0]) + '.' + yyyy;       
        if (storeLanguage === 'de') {
          return dateFirst;
        } else {
          return yearFirst;
        }
      }; 
      
      d = new Date();
      
      $('.payment-date').html(d.OrderDate());
      //display item/ offer image
      // var itemImg = ( offerItem.images && offerItem.images.length > 0 && offerItem.images[0].uri ) ? offerItem.images[0].uri : null;
      // if (!itemImg && offer.images && offer.images.length > 0) {
      //   itemImg = offer.images[0].uri;
      // }
      // if (itemImg) {    
      //   $('.shopping-cart .thumbnail').html('<img src="' + itemImg + '">').show();
      //   $('.cart-summary-table').removeClass('without-thumbnail');
      // } else {
      //   // case with no offer image
      //   $('.shopping-cart .thumbnail').hide();
      //   $('.cart-summary-table').addClass('without-thumbnail');
      // }

      var address = paymentTransactionParameters.addressInfo;
      var stateAbbreviation = '';
      if( address.stateCode ) {
        stateAbbreviation = ' ' + ((address.stateCode.indexOf('-') > -1) ? address.stateCode.split('-')[1] : address.stateCode);
      }
      var billingAddress = address.street1 + (address.street2 ? (', ' + address.street2) : '') + '<br/>'
                        + address.city + ((stateAbbreviation.trim()!=='') ? (',' + stateAbbreviation) : '') + '<br/>' + address.zipCode;
      var paymentName = $('select#method-list').find('option:selected').data('name');
      $('.payment-details-table .billingAddress').html(billingAddress); 
      $('.payment-details-table .nameOnCard').text(address.firstName + ' ' + address.lastName);
      $('.payment-details-table .email, .delivery-method').text($("#email").val().trim());
     
      if ( payment_id == 'cpgCreditCard' ) {
        var cardType = paymentTransactionParameters.creditCard.type;
        var _unencryptedNumber = $('#cardNumber').val().split("-").join("");
        var _lastFourDigits = _unencryptedNumber.substr(_unencryptedNumber.length - 4);
        var cardNumber = '************' + _lastFourDigits;
        $('.payment-details-table .paymentName-img').html('<span class="icon ' + cardType.toLowerCase() + '-icon"></span>');
        $('.payment-details-table .payment-type').html(cardType);
      } else {                    
        $('.payment-details-table .payment-type').html(paymentName);
        $('.payment-details-table .paymentName-img').html('<span class="icon ' + payment_id.substring(3).toLowerCase() + '-icon"></span>');
      }

      if ( payment_id === 'cpgSEPADirectDebit' ) {
        $('.sddPayment').show();	
        $('.dr_paymentWrapper').addClass('onSdd');
      } else {
        $('.sddPayment').hide();
        $('.dr_paymentWrapper').removeClass('onSdd');
      }

      updateSellingEntity(data);
      $('.terms-of-service .seller-name').text(paymentTransactionParameters.sellingEntity.text);
      
      // addDNSPixel(data);
      CheckState("#ReviewYourOrder");

      // get thank you page type
      paymentTransactionParameters.thankYouPageType = data.thankYouPageType;
    }
  });
  // return true;
}

function sendConfirmForm() {
  var isExternalWindow = false;
  if ( paymentTransactionParameters.paymentFormId == 'cpgSEPADirectDebit' ) {
    $("#sddMandateForm").submit();
    if (SEPAConfirmForm.numberOfInvalids()) {
      return false;
    }
  }
  if ( $('#tos').prop('checked') ) {
    var fmt = new DateFmt();
    var payment_id = paymentTransactionParameters.paymentFormId;
    var confirmdata = {
      transactionId: paymentTransactionParameters.transactionId,
      termsAndConditionsId: paymentTransactionParameters.termsAndConditionsId,
      timeZoneInfo: getTimeZoneInfo(),
      catalogIdentifier: paymentTransactionParameters.ssoCatalogType ? paymentTransactionParameters.ssoCatalogType : storeParam.catalog
    };

    if ( payment_id == 'cpgCreditCard' ) {
      //TK-37978 Get creditCardCvc from input field value when reccurring users don't need to pass payment method call
      confirmdata.creditCardCvc = paymentTransactionParameters.creditCard.securityCode || $("#cardSecurityCode").val();
    } else if ( payment_id == 'cpgSEPADirectDebit' && typeof paymentTransactionParameters.bankBillingInfoId != 'undefined' ){
      confirmdata.bankBillingInfoId = paymentTransactionParameters.bankBillingInfoId;
      var sddMandate = paymentTransactionParameters.SDD.mandate;
      paymentTransactionParameters.SDD.emailAsSignature = (sddMandate.mandateType == "RECURRING" && sddMandate.mandateState == "SIGNED") ? sddMandate.mandateSignatureEmail : $("#signEmail").val().trim();
      confirmdata.mandateAcceptance = {
        "accepted" : true, 
        "emailAsSignature" : paymentTransactionParameters.SDD.emailAsSignature
      };
    } else if (payment_id == 'cpgYandexMoney' || payment_id == 'cpgWebMoney' || payment_id == 'cpgKonbini' || payment_id == 'cpgPayEasy' || payment_id == 'cpgSevenElevenShop' || payment_id == 'cpgAlipay') {
      confirmdata.creditCardCvc = null;
    }
   
    // popup window in advance
    if ( (arrPaymentGroupType[payment_id] == 'newWindow' || arrPaymentGroupType[payment_id] == 'iFrame') && (payment_id !== 'cpgPayPalPreApproved' || paymentTransactionParameters.thankYouPageType !== 'PURCHASE_AUTHORIZED')) {
      paypalWindow = window.open( "loading.html", 'PayPal', 'width=800,height=600,resizable=yes,status=yes,screenX=50,screenY=50,top=50,left=50,scrollbars=yes' );
      isExternalWindow = true;
    }

    paymentTransactionParameters.transactionStep = 'order-confirm';
    // set overlay content in different conditions
    progressOverlayText.overlayContent = $.localize('drog.overlay.message.payment.processing');
       
    // CAPTURE PAYMENT call 
    $.ajax({
      type: config.debug ? "GET" : "POST",
      url: apiPath.captureUrl() + getHeaderParams() + '&fields=transaction',
      xhrFields: { 
        withCredentials: true 
      },
      beforeSend: setHeader,
      dataType: config.default_dataType,
      contentType: getContentType(),
      jsonpCallback: "callback",
      data: JSON.stringify(confirmdata),
      error: globalErrorCaptureAPIHandler
    }).done(function(data) {
      transData = data;
      var isPurchaseSuccess = false;
      if (typeof data.transactionId !== 'undefined' && data.transactionId !== null) {
        isPurchaseSuccess = true;
      }

      var offer = paymentTransactionParameters.selectedOffer;
      var offerItem = offer.items[0];
      var selectedOfferItemDesc = getObjectByLocale(offerItem.descriptions, storeLanguage);

      if( isPurchaseSuccess ) {
        var $cartSummary = $('.shopping-cart');		
        $cartSummary.find('.cart-product-name').html(selectedOfferItemDesc['name']);		
        $cartSummary.find('.cart-product-description').html(selectedOfferItemDesc['short']);    
        $cartSummary.find('.cart-subTotal').html(formatedPrice(data.amount, true, false));		
        $cartSummary.find('.cart-total').html(formatedPrice(data.amountTotal, true, false));		
        // Tax vs Tax Incl Based on Currency
        if (!paymentTransactionParameters.taxOnTop) {
          // "amount" is different on API response
          $cartSummary.find('.cart-subTotal').html(formatedPrice(data.amountTotal, true, false));
          $cartSummary.find('.cart-vat-row').hide();
        } else {
          var priceTax = formatedPrice(data.tax, true, false);
          $cartSummary.find('.cart-vat').html(priceTax);
          $cartSummary.find('.cart-vat-row').show();
        }
        //display item/ offer image		
        // var itemImg = ( offerItem.images && offerItem.images.length > 0 && offerItem.images[0].uri ) ? offerItem.images[0].uri : null;		
        // if (!itemImg && offer.images && offer.images.length > 0) {		
        //   itemImg = offer.images[0].uri;		
        // }
        // if (itemImg) {    
        //   $('.shopping-cart .thumbnail').html('<img src="' + itemImg + '">').show();
        //   $('.cart-summary-table').removeClass('without-thumbnail');
        // } else {
        //   // case with no offer image
        //   $('.shopping-cart .thumbnail').hide();
        //   $('.cart-summary-table').addClass('without-thumbnail');
        // }
        
        paymentTransactionParameters.totalPrice = data.amountTotal;
        paymentTransactionParameters.subPrice = data.amount;

        if ( typeof data.transaction !== 'undefined' && data.transaction !== null ) {
          if( typeof data.transaction.lineItems !== 'undefined' && data.transaction.lineItems !== null && data.transaction.lineItems.length > 0 ) {
            var $lineItemDetail = data.transaction.lineItems; 
            if ( typeof $lineItemDetail[0].serialCode !== "undefined" && $lineItemDetail[0].serialCode !== null ) { 
              $('.thankyouText.with-serialCode').show().find('.serialCodeVal').html($lineItemDetail[0].serialCode);
              $('a.code-redeem-link').attr('href', replaceStringArgs($.localize('drog.code.redeem.link'), [storeLanguage, $lineItemDetail[0].serialCode]));
            } else {
              $('.thankyouText.no-serialCode').show();
              $('a.code-redeem-link').hide();
            }
          }
        }
      }

      // SUCCESS_PURCHASE or PENDING_PURCHASE
      if ( typeof data.thankYouPageType != 'undefined' && data.thankYouPageType !== null ) {
        paymentTransactionParameters.thankYouPageType = data.thankYouPageType;
      }
      // TK-44570  - Add MK's to TY page:
      if (typeof data.freeText !== 'undefined' && data.freeText !== null) {
        paymentTransactionParameters.freeText = data.freeText;
        $('.thank-you-modal .thankyou-freetext').html(data.freeText)
      }
     
      var paymentName = $('select#method-list').find('option:selected').data('name');

      if ( payment_id == 'cpgCreditCard' ) {
        CheckState("#CompleteOrder");

      } else if (payment_id == 'cpgELV' || payment_id == 'cpgSEPADirectDebit') {
        // ELV payment
        // window.setTimeout(function(){$("#ajax_overlay").fadeOut(0);}, 800);
        // Determine thankYouPageType
        if (paymentTransactionParameters.thankYouPageType == 'SUCCESS_PURCHASE') {
          CheckState("#CompleteOrder");
        }
        
      } else if ( payment_id == 'cpgKonbini' || payment_id == 'cpgPayEasy' || payment_id == 'cpgSevenElevenShop' ) {
        //window.setTimeout('$("#ajax_overlay").fadeOut(0);', 800);
        if ( paymentTransactionParameters.thankYouPageType == 'INSTRUCTIONS_FOR_PURCHASE' ) {
          paymentTransactionParameters.authorizationCode = data.authorizationCode;
          paymentTransactionParameters.redirectURL = data.redirectURL;
          paymentTransactionParameters.expirationDate = data.expirationDate;
          paymentTransactionParameters.amountTotal = data.amountTotal;
          CheckState("#CompleteOrder");
        } 
      } else if ( arrPaymentGroupType[payment_id] == 'newWindow' || arrPaymentGroupType[payment_id] == 'iFrame' ) {
        if ( payment_id == 'cpgPayPalPreApproved' && !data.redirectURL ) {
          // for second purchase, capture response will be like creditcard and not contain redirectURL
          if( isPurchaseSuccess ) {
            // success purchase
            CheckState("#CompleteOrder");
          } else {
            // DROG-6571 handle followUpActionList when Payment Authorization Failed
            if ( typeof data.followUpActionList !== 'undefined' ) {
              var failedMsg = '<div class="follow-up-header">' + $.localize('drog.payment.authorization.failed') + '</div>' +
                              '<div>' + $.localize('drog.payment.followup.message') + '</div>' +
                              genFollowUpContent(data.followUpActionList);

              $('.follow-up-content').html(failedMsg).show();
              $('.follow-up-overlay').show();

            } else {
              CheckState('#PaymentSelection');
              popupMessage($.localize('drog.payment.authorization.failed'));
            }
          }
        }

        // External payment link
        if ( data.redirectURL ) {
          // extend token timeout             
          loadAjaxData(apiPath.authenticateUrl(), {beforeSendCB: setHeader}, function(response) {
            if (response.access_token) {
              authenticatedInfo.token_type = response.token_type;
              authenticatedInfo.access_token = response.access_token;
              authenticatedInfo.expires_in = response.expires_in;
            }
          });

          if (payment_id == 'cpgIBP') {
            var bankBilling = paymentTransactionParameters.bankBilling;
            if (bankBilling.bankName) {
              paymentName = paymentName + " - " + bankBilling.bankName;
            }
          }

          $('.ajax-overlay').find('.ajax-loader').html( replaceStringArgs($.localize('drog.payment.externalinfo.message'), [paymentName, data.redirectURL, paymentName]) );

          if ( checkRedirectURL(data.redirectURL) == 'form') {
            paymentTransactionParameters.externalUrl.formString = data.redirectURL;
          } else if ( checkRedirectURL(data.redirectURL) == 'url' ) {
            paypalWindow.location.href = data.redirectURL;
          }
          
          window.setTimeout( function() {
            paypalWindowTimer = setInterval(checkChild, 500);
          }, 3000);          
        }
      }

      if ( isExternalWindow ) {
        var overlayTimer = setInterval(function() {
          if ( !$('.ajax-overlay').is(':visible') ) {
            overlayHandler('show');
            clearInterval(overlayTimer);
          }
        }, 50);
      }
    });
    
  } else {
    popupMessage($.localize("drog.terms.not.accepted"));
  }
}

function getBillingData(paymentType, isRemoved) {
  var firstName = $("#firstname").val().trim();
  var lastName = $("#lastname").val().trim();

  // map to paymentTransactionParameters
  if ( !isRemoved ) {
    paymentTransactionParameters.paymentFormId = paymentType;
    paymentTransactionParameters.addressInfo.city = $("#city").val().trim();
    paymentTransactionParameters.addressInfo.countryCode = authenticatedInfo.countryIdentifier;
    paymentTransactionParameters.addressInfo.email = $("#email").val().trim();
    paymentTransactionParameters.addressInfo.firstName = firstName;
    paymentTransactionParameters.addressInfo.lastName = lastName;
    paymentTransactionParameters.addressInfo.stateCode = $('#state').val();
    paymentTransactionParameters.addressInfo.street1 = $("#address").val().trim();
    paymentTransactionParameters.addressInfo.street2 = $("#addressExtra").val().trim();
    paymentTransactionParameters.addressInfo.zipCode = $("#zipCode").val().trim();
  }

  // D-06753 6ft - v1 Only - Remove save info for all payments
  paymentTransactionParameters.showDetailsInStore = false;

  if (paymentType == 'cpgCreditCard') {
    if ( !isRemoved ) {
      paymentTransactionParameters.creditCard.expiresMonth = $("#cardExpirationMonth").val();
      paymentTransactionParameters.creditCard.expiresMonthForUI = $("#cardExpirationMonth").val();
      paymentTransactionParameters.creditCard.expiresYear = $("#cardExpirationYear").val();
      paymentTransactionParameters.creditCard.expiresYearForUI = $("#cardExpirationYear").val();
      paymentTransactionParameters.creditCard.name = firstName + " " + lastName;
      paymentTransactionParameters.creditCard.unencryptedNumber = $('#cardNumber').val().split("-").join("");
      paymentTransactionParameters.creditCard.securityCode = $("#cardSecurityCode").val();
      // Get card-type while validating cardNumber
      //paymentTransactionParameters.creditCard.type = getCreditCardType($("#cardNumber").val().split("-").join(""));
      paymentTransactionParameters.creditCard.lastFourDigits = paymentTransactionParameters.creditCard.unencryptedNumber.substr(paymentTransactionParameters.creditCard.unencryptedNumber.length - 4);
    } else {
      paymentTransactionParameters.creditCard.unencryptedNumber = '************' + paymentTransactionParameters.creditCard.lastFourDigits;
      paymentTransactionParameters.creditCard.securityCode = '***';
    }
  }

  // NOTE: keep for other payment [Vick]
  // if(paymentType == 'cpgELV') {
  //     paymentTransactionParameters.ELV.bankBranchNumber = $("#bankRoutingCode").val();
  //     paymentTransactionParameters.ELV.bankName = $("#bankName").val();
  //     paymentTransactionParameters.ELV.bankAccountHolder = $("#bankAccountHolder").val();
  //     paymentTransactionParameters.ELV.unencryptedNumber = $("#bankAccountNumber").val();
  //     paymentTransactionParameters.ELV.displayValue = paymentTransactionParameters.ELV.unencryptedNumber.substr(paymentTransactionParameters.ELV.unencryptedNumber.length-4);
  // }

  if (paymentType == 'cpgSEPADirectDebit' && !isRemoved) {
    paymentTransactionParameters.SDD.bankAccountHolder = firstName + " " + lastName;
    paymentTransactionParameters.SDD.bankBranchNumber = $("#sdd_bankRoutingCode").val();
    paymentTransactionParameters.SDD.unencryptedNumber = $("#sdd_bankAccountNumber").val();
    paymentTransactionParameters.SDD.displayValue = paymentTransactionParameters.SDD.unencryptedNumber.substr(paymentTransactionParameters.SDD.unencryptedNumber.length-4);
  }

  if (paymentType == 'cpgIBP' && !isRemoved) {
    if (paymentTransactionParameters.bankBilling.bankBranchNumber != $("#ibpBankName option:selected").data('bank-id')) {
      paymentTransactionParameters.bankBilling.bankBillingInfoExternalId = "";
    }
    paymentTransactionParameters.bankBilling.bankName = $("#ibpBankName option:selected").text();
    paymentTransactionParameters.bankBilling.bankBranchNumber = $("#ibpBankName option:selected").data('bank-id');
  }

  if (paymentType == 'cpgYandexMoney') {
    paymentTransactionParameters.bankBilling.bankName = "Yandex.Money";
    paymentTransactionParameters.bankBilling.bankBranchNumber = "Yandex.Money";
  }

  if (paymentType == 'cpgKonbini') {
    paymentTransactionParameters.referencedBilling.referenceEntityId = $('input[name="konbini_stores"]:checked').val();
  }

  if (paymentType == 'cpgPayEasy') {
    paymentTransactionParameters.referencedBilling.referenceEntityId = '060';
  }

  if (paymentType == 'cpgSevenElevenShop') {
    paymentTransactionParameters.referencedBilling.referenceEntityId = '010';
  }

  var address = paymentTransactionParameters.addressInfo;
  var billingData = {
    showDetailsInStore: paymentTransactionParameters.showDetailsInStore, 
    paymentType : paymentType,
    scope : scopeType,
    address : {
      "firstName": firstName,
      "lastName": lastName,
      "city": address.city,
      "street1": address.street1,
      "street2" : address.street2,
      "zipCode": address.zipCode,
      "countryCode": address.countryCode,
      "stateCode": address.stateCode,
      "phone": address.phone ? address.phone.replace(/[^\d]/g, '') : address.phone,
      "email": address.email,
      "type": "billing"
    }
  };

  if ( paymentType == 'cpgCreditCard' ) {
    var creditCard = paymentTransactionParameters.creditCard;
    billingData.creditCard = {
      "expiresMonth": creditCard.expiresMonth,
      "expiresYear": creditCard.expiresYear,
      "name": creditCard.name,
      "unencryptedNumber": creditCard.unencryptedNumber,
      "securityCode": creditCard.securityCode,
      "type": creditCard.type,
      "externalId": paymentTransactionParameters.creditCardId || ""
    };
  }

  if (paymentType == 'cpgPayPalPreApproved') {
    billingData.creditCard = null;
    var referencedBilling =  paymentTransactionParameters.referencedBilling;
    if (referencedBilling.referencedBillingInfoExternalId !== null) {
      billingData.referencedBilling = {
        "email": address.email,
        "scope": "default",
        "paymentType": "cpgPayPalPreApproved",
        "referencedBillingInfoExternalId" : referencedBilling.referencedBillingInfoExternalId
      };
    } else {
      billingData.referencedBilling = {
        "email": address.email,
        "scope": "default",
        "paymentType": "cpgPayPalPreApproved"
      };
    }
  }

  // NOTE: keep for other payment [Vick]
  // if(paymentType == 'cpgELV') {
  //   var elvForm = paymentTransactionParameters.ELV;
  //   billingData.bankBilling = {
  //     "bankAccountNumber": elvForm.unencryptedNumber,
  //     "bankBranchNumber": elvForm.bankBranchNumber,
  //     "bankAccountHolder": elvForm.bankAccountHolder,
  //     "bankName": elvForm.bankName,
  //     "bankBillingInfoExternalId": elvForm.bankBillingInfoExternalId || ""
  //   };

  if ( paymentType == 'cpgIBP' || paymentType == 'cpgYandexMoney' ) {
    var bankBilling = paymentTransactionParameters.bankBilling;
    billingData.bankBilling = {
      "bankName": bankBilling.bankName,
      "bankBranchNumber": bankBilling.bankBranchNumber,
      "bankBillingInfoExternalId": bankBilling.bankBillingInfoExternalId || ""
    };
  } else if(paymentType == 'cpgKonbini' || paymentType == 'cpgPayEasy' || paymentType == 'cpgSevenElevenShop') {
    var referencedBilling =  paymentTransactionParameters.referencedBilling;
    billingData.referencedBilling = {
      "referenceEntityId": referencedBilling.referenceEntityId
    };
  } else if (paymentType == 'cpgSEPADirectDebit') {
    var sddForm = paymentTransactionParameters.SDD;
    billingData.bankBilling = {
      "bankAccountNumber": sddForm.unencryptedNumber,
      "bankBranchNumber": sddForm.bankBranchNumber,
      "bankAccountHolder": sddForm.bankAccountHolder,
      "bankBillingInfoExternalId": sddForm.bankBillingInfoExternalId || ""
    };
  }

  return billingData;
}

var formValidator = function() {
  validatePaymentForm = $("#payment-form").validate({
    errorClass: "invalid",
    errorElement: 'span',
    validClass: "valid",   
    rules: {
      firstname: {
        required: true,
        noNumbers: true,
        forFirstNameMinLength: true,
        forValidSymbolFilter: true,
        minlength: 1,
        maxlength: 50
      },
      lastname: {
        required: true,
        noNumbers: true,
        forLastNameMinLength: true,
        forValidSymbolFilter: true,
        minlength: 1,
        maxlength: 50
      },
      address: {
        required: true,
        forValidSymbolFilter: true,
        minlength: 2,
        maxlength: 50
      },
      addressExtra: {
        forValidSymbolFilter: true,
        minlength: 2,
        maxlength: 50
      },
      city: {
        required: true,
        forValidSymbolFilter: true,
        noNumbers: true,
        minlength: 2,
        maxlength: 50
      },
      zipCode: {
        required: true,
        forZipFilter: true,
        minlength: 2,
        maxlength: 10
      },
      bankAccountHolder: "required forValidSymbolFilter forFirstNameLength forLastName forLastNameLength forFirstNameMinLength forLastNameMinLength noNumbers",
      bankAccountNumber: {
        required: true,
        number: true,
        maxlength: 11
      },
      bankName: {
        required: true,
        alphanumeric: true,
        maxlength: 30
      },
      bankRoutingCode: {
        required: true,
        number: true,
        maxlength: 5
      },
      sdd_bankAccountNumber: {
        required: true,
        sepa_validAccountNumber: true
      },
      sdd_bankRoutingCode: {
        required: true,
        sepa_validBIC: true
      },
      ibpBankName: {
        required: true,
        validBankId: true
      },
      cardNumber: {
        required: true,
        //creditcard: true,
        supportedCard: true,
        minlength: 12,
        maxlength: 19
      },
      cardSecurityCode: {
        required: true,
        minlength: 3,
        maxlength: 3
      },
      cardExpirationMonth: {
        required: true,
        CCExp: {
          month: '#cardExpirationMonth',
          year: '#cardExpirationYear'
        }
      },
      cardExpirationYear: {
        required: true,
        number: true,
        CCExp: {
          month: '#cardExpirationMonth',
          year: '#cardExpirationYear'
        }
      },
      email: {
        required: true,
        supportSpecialCharEmail: true,
        email: false
      }
    },
    groups: {
      ccExpGroup: "cardExpirationMonth cardExpirationYear"
    },
    errorPlacement: function(error, element) {
      error.addClass("error-bubble").insertAfter(element);
    },
    highlight: function(element, errorClass, validClass) {
      if ($(element).parent().hasClass('expiration-field')) {
        $(element).parent().addClass(errorClass).removeClass(validClass);
      } else {
        $(element).addClass(errorClass).removeClass(validClass);
      }
      $(element).parent('.column, .left-inline-column').find('label').addClass(errorClass).removeClass(validClass);
      $('#payment-form').find('button.next').prop('disabled', true).addClass('disabled');

      popupMessage($.localize('drog.error.validation.alert'));
    },
    unhighlight: function(element, errorClass, validClass) {
      if ($(element).parent().hasClass('expiration-field')) {
        $(element).parent().removeClass(errorClass).addClass(validClass);
      } else {
        $(element).removeClass(errorClass).addClass(validClass);
      }
       $(element).parent('.column, .left-inline-column').find('label').removeClass(errorClass).addClass(validClass);
      if ( !this.numberOfInvalids() ) {
        hidePopupMessage();
        $('#payment-form').find('button.next').prop('disabled', false).removeClass('disabled');
      }
    }
  });

SEPAConfirmForm = $("#sddMandateForm").validate({
    errorClass: "invalid",
    errorElement: 'span',
    validClass: "valid",
    rules: {
      signEmail: {
        required: true,
        email: true
      },
      agreeSEPA: {
        required: true
      }
    },
    messages: {
      agreeSEPA: $.localize("drog.sepa.mandate.please.agreeterms"),
      signEmail: $.localize("drog.please.enter.a.valid.email.address")
    },
    errorPlacement:function(error, element) {
      //popupMessage(error.text());
      error.addClass("error-bubble").insertAfter(element);      
    },
    highlight:function(element, errorClass, validClass){
      $(element).addClass(errorClass).removeClass(validClass);
      $(element).parent('.column, .left-inline-column').find('label').addClass(errorClass).removeClass(validClass);
      
      $('.confirmation-modal .button.confirm').addClass('disabled');     
    },
    unhighlight:function(element, errorClass, validClass){
      $(element).removeClass(errorClass).addClass(validClass);
      $(element).parent('.column, .left-inline-column').find('label').removeClass(errorClass).addClass(validClass);
      if ( !this.numberOfInvalids() && $('#tos').prop('checked') ) {
        hidePopupMessage();
        $('.confirmation-modal .button.confirm').removeClass('disabled');
      }
    }
  });

  $("#payment-form, #sddMandateForm").submit(function () {
    return false;
  });

  //D-08649 6ft V1 store : Polish and Arabic characters are not allowed in payment details fields.
  $.extend( $.validator.messages, {
    required: $.localize('drog.validation.message.required'),
    email: $.localize('drog.validation.message.email'),
    number: $.localize('drog.validation.message.number'),
    maxlength: $.localize('drog.validation.message.maxlength'),
    minlength: $.localize('drog.validation.message.minlength'),
  });

};

var getCreditCardType = function(accountNumber) {
  //start without knowing the credit card type
  var result = "unknown";
  // enhanced JS validation with luhnCheck
  if (accountNumber.luhnCheck()) {
    // B-25394 MTX Platform Update for Mastercard BIN# identification - 6ft v1 & v2
    if (/^(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}$/.test(accountNumber)) {
      result = "MASTERCARD";
    } else if (/^(?:4[0-9]{12}(?:[0-9]{3})?)$/.test(accountNumber)) { //then check for Visa
      result = "VISA";
    } else if (/^(?:3[47][0-9]{13})$/.test(accountNumber)) { //then check for AmEx
      result = "AMEX";
    } else if (isCardTypeSupported("DISCOVER") && /^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/.test(accountNumber)) {
        result = "DISCOVER";
    } else if (isCardTypeSupported("JCB") && /^(?:(?:2131|1800|35\d{3})\d{11})$/.test(accountNumber)) {
        result = "JCB";
    } else if (isCardTypeSupported("DINERS") && /^(?:3(?:0[0-5]|[68][0-9])[0-9]{11})$/.test(accountNumber)) {
        result = "DINERS";  
    } else if( isCardTypeSupported("UNIONPAY") && /^(?:(?:62|88)[0-9]{14,17})$/.test(accountNumber)) {
        result = "UNIONPAY";
    }
  }
  
  
  securityCodeLength(result);

  if (result !== "unknown") {
    paymentTransactionParameters.creditCard.type = result;
  }
  return result;
};

var fn_reloadUserMeta = function() {
  loadAjaxData(apiPath.userMetaUrl() + '&country=' + authenticatedInfo.countryIdentifier  + getHeaderParams(), {
    beforeSendCB: function(xhr) {
      setHeader(xhr);
      paymentTransactionParameters.preSelectedPaymentForm = $('#method-list').find('option:selected').data('info');
    }
  }, function(data) {

    updateSellingEntity(data);

    if (data.address.length > 0 && typeof data.address[0].accountId !== "undefined" && data.address[0].accountId !== null) {
      bindAddressData(data.address[0]);
      $('.payment-form').data('default-address', data.address[0]);
    }

    if (data.banks && typeof data.banks !== "undefined") {
      // re-bind bank options for IBP payment
      setIBPBankOptions(data.banks);
    }

    if (data.paymentTypes.length > 0) {
      setPaymentOptions(data.paymentTypes, true);
    }

    // D-06799
    updatePaymentOptionsByCurrency('EUR', ['cpgIBP', 'cpgSEPADirectDebit']);

    // To show default payment type
    if ( !paymentTransactionParameters.hasDefaultPayment || !$('.paymentMethodBox').is(':visible') ) {
      $('#method-list').find('option').eq(1).prop('selected', true).trigger('change');
    }

    var preSelectedPaymentForm = paymentTransactionParameters.preSelectedPaymentForm;
    if ( preSelectedPaymentForm ) {
      var $selectedPaymentOption = $('#method-list').find('option[for="' + preSelectedPaymentForm.paymentType + '"]');

      if ($selectedPaymentOption.length > 0) {
        $selectedPaymentOption.prop('selected', true).trigger('change');
      }
    }

    // NOTE: keep for multiple payment forms [Vick]
    // var preSelectedPaymentForm = paymentTransactionParameters.preSelectedPaymentForm;
    // if ( preSelectedPaymentForm ) {
    //   if ( preSelectedPaymentForm.paymentInfoExternalId ) {
    //     $.each($('#select-paymentType option'), function(index, val) {
    //         var self_paymentInfoExternalId = $(this).data('info').paymentInfoExternalId;
    //         if ( self_paymentInfoExternalId && self_paymentInfoExternalId == preSelectedPaymentForm.paymentInfoExternalId ) {
    //           $(this).prop('selected', true).trigger('change');
    //         }
    //     });
    //   } else if ( preSelectedPaymentForm.paymentType ) {
    //     $('#select-paymentType').val(preSelectedPaymentForm.paymentType).trigger('change');
    //   }
    // } else if ( !paymentTransactionParameters.hasDefaultPayment || !$('.dr_paymentMethodBox').is(':visible') ) {
    //   // To show default payment type
    //   $('#select-paymentType').trigger('change');
    // }
  });
};

var paypalWindow;
var paypalWindowTimer;

var checkChild = function() {
  if (paypalWindow.closed) {
    cancelPaypalWindow();
  }
};

var cancelPaypalWindow = function() {
  // stop detecting close event of paypal window
  clearInterval(paypalWindowTimer);
  overlayHandler('hide');
  CheckState("#ProductSelection");
  var message = $.localize("drog.you.have.successfully.cancelled.your.transaction") + " <br /> " + $.localize("drog.please.try.again.by.using.a.different.payment.method");
  popupMessage(message);
};

var successPaypalWindow = function() {
  // stop detecting close event of paypal window
  clearInterval(paypalWindowTimer);
  var timeZoneInfo = getTimeZoneInfo();
  overlayHandler('show');
  
  $.ajax({
    url: apiPath.finalizeUrl() + getHeaderParams(),
    xhrFields: {
      withCredentials: true
    },
    type: "POST",
    dataType: config.default_dataType,
    contentType: getContentType(),
    jsonpCallback: "callback",
    global: false,
    data: JSON.stringify(timeZoneInfo),
    beforeSend: setHeader
  }).fail(function(XHR, event, thrownError, options) {
    // Paypal fail
    if ( console && console.log ) {
      console.log("url: " + apiPath.finalizeUrl());
      console.log("fn finalize xhr.status: " + XHR.status);
      console.log("fn finalize xhr.responseText: " + XHR.responseText);
      console.log("fn finalize thrownError: " + thrownError);
    }
    CheckState('#ProductSelection');
    globalErrorHandler(event, XHR, options, thrownError);

  }).done(function(data) {
    // paypal success
    // Paypal payment has to show purchase completed page after successfully completing whole process

    // D-06613 6ft - Serial Code Not included in API response on Redirected Payment Methods
    if ( typeof data.transaction !== 'undefined' && data.transaction !== null ) {
      if ( typeof data.transaction.lineItems !== 'undefined' && data.transaction.lineItems !== null && data.transaction.lineItems.length > 0 ) {
        var $lineItemDetail = data.transaction.lineItems; 
        if ( typeof $lineItemDetail[0].serialCode !== "undefined" && $lineItemDetail[0].serialCode !== null ) { 
          $('.thankyouText.with-serialCode').show().find('.serialCodeVal').html($lineItemDetail[0].serialCode);
          $('a.code-redeem-link').attr('href', replaceStringArgs($.localize('drog.code.redeem.link'), [storeLanguage, $lineItemDetail[0].serialCode]));
        } else {
          $('.thankyouText.no-serialCode').show();
          $('a.code-redeem-link').hide();
        }
      }
    }

    CheckState('#CompleteOrder');

  }).always(function() {
    overlayHandler('hide');
  });
};

var popupMessage = function(message) {
  var $dialog = $(".error-popup");
  $dialog.find(".error-text").html(message);
  $dialog.show();
};

var hidePopupMessage = function() {
  var $dialog = $(".error-popup");
  $dialog.find(".error-text").empty();
  $dialog.hide();
};

var resolveBackToTheStoreLink = function(purchase_finished) {
  if (purchase_finished) {
    if (getUrlVars().backToStore) {
      return $.localize("drog.back.to.store.purchase.finished.full.url." + getUrlVars().backToStore);
    } else {
      return $.localize("drog.back.to.store.purchase.finished.full.url");
    }
  } else if (getUrlVars().backToStore) {
    return $.localize("drog.back.to.store.full.url." + getUrlVars().backToStore);
  } else {
    return $.localize("drog.back.to.store.full.url");
  }
};

var getFormatedConfirmedDate = function(ms) {
  var date = new Date(ms);

  var fullYear = date.getFullYear();
  var dateString = date.toDateString();
  var hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  var seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
  
  return dateString.split(fullYear)[0] + hours + ':' + minutes + ':' + seconds + ' ' + fullYear;
};

// B-22811 6ft - v1 webstore only request - add VersaTag tracking
//Button implementation versaTag 
var transData, trackProduct;
var trackPurchaseComplete = function() {
  var transCurrency = paymentTransactionParameters.currencyIdentifier;
  var transferAmount = parseFloat(transData.amountTotal).toFixed(2);
  var transferTax = parseFloat(transData.tax).toFixed(2);
  
  if (typeof versaTagObj !== 'undefined' && versaTagObj !== null) {
    versaTagObj.clearActivityParam();
    versaTagObj.setActivityParam("OrderID", transData.transactionId);
    versaTagObj.setActivityParam("Session", authenticatedInfo.access_token);
    versaTagObj.setActivityParam("Value", transferAmount);
    versaTagObj.setActivityParam("productid", trackProduct.id);
    versaTagObj.setActivityParam("productinfo", trackProduct.name);
    versaTagObj.setActivityParam("Quantity", "1");
    versaTagObj.setActivityParam("currency", transCurrency);
    versaTagObj.setActivityParam("ProductID", trackProduct.id);
    versaTagObj.generateRequest("http://www.6ft.com/store/dreadnought/thankyou.html");
    //versaTagObj.generateRequest(window.location.protocol + "//" + window.location.hostname + window.location.pathname);
  }
  // Add MOTHERSHIP JavaScript tracker code
  if (storeLanguage === 'de'){            
    var OA_p = (location.protocol=='https:'?'https://mship.de/www/delivery/tjs.php':'http://mship.de/www/delivery/tjs.php');
    //define values
    var amount = transferAmount;
    // defined parameters
    var OrderID = escape(transData.transactionId);
    var basket = escape(amount);                            
    var OA_r=Math.floor(Math.random()*999999);          
    // append query string to head which add defined parameters
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src =  OA_p + '?trackerid=65&append=0&r=' + OA_r + '&OrderID=' + OrderID + '&basket=' + basket; 
    document.getElementsByTagName("head")[0].appendChild(script);
  } 
  
  // B-23211 Request to add Google Analytics Tracking to the V1 store
  /* eCommerceDataLayer.push({
    'event': 'checkout',
    'ecommerce': {
      'checkout': {
        'actionField': {'step': 1},
        'products': [{
          'name': trackProduct.name,
          'id': trackProduct.id,
          'price': trackProduct.price,
          'brand': trackProduct.brand,
          'category': trackProduct.category,
          'quantity': 1
       }]
     }
   }
  }); */

  /* eCommerceDataLayer.push({
    'ecommerce': {
      'purchase': {
        'actionField': {
          'id': transData.transactionId,                         // Transaction ID. Required for purchases and refunds.
          'affiliation': storeParam.game,
          'revenue': transferAmount,    // Total transaction value (incl. tax and shipping)
          'tax': transferTax,
          'shipping': '0',
          'coupon': ''
        },
        'products': [{                            // List of productFieldObjects.
          'name': trackProduct.name,
          'id': trackProduct.id,
          'price': trackProduct.price,
          'brand': trackProduct.brand,
          'category': trackProduct.category,
          'variant': '',
          'quantity': 1,
          'coupon': ''                            // Optional fields may be omitted or set to empty string.
         }]
      }
    }
  }); */

  if (typeof ga !== 'undefined' && ga !== null) {
    ga('require', 'ecommerce');
    ga('ecommerce:addTransaction', {
      'id': transData.transactionId, // Transaction ID. Required.
      'affiliation': storeParam.game, // Affiliation or store name.
      'revenue': transferAmount, // Grand Total.
      'shipping': '0', // Shipping.
      'tax': transferTax, // Tax.
      'currency': paymentTransactionParameters.currencyIdentifier // local currency code.
    });
    ga('ecommerce:addItem', {
      'id': transData.transactionId, // Transaction ID. Required.
      'name': trackProduct.name, // Product name. Required.
      'sku': trackProduct.id, // SKU/code.
      'category': trackProduct.category, // Category or variation.
      'price': trackProduct.price,  // Unit price.
      'quantity': '1', // Quantity.
      'currency': paymentTransactionParameters.currencyIdentifier
    });
    ga('ecommerce:send');
  }
};

// 6806
var setSsoParams = function() {
  // pre-selected offer
  if (getUrlVars().transactionId) {
    if (getUrlVars().transactionId.indexOf("#") > 0) {
      paymentTransactionParameters.externalTransactionId = getUrlVars().transactionId.substr(0, getUrlVars().transactionId.indexOf("#"));
    } else {
      paymentTransactionParameters.externalTransactionId = getUrlVars().transactionId;
    }
  }
  if (getUrlVars().priceId) {
    if (getUrlVars().priceId.indexOf("#") > 0) {
      paymentTransactionParameters.ssoPriceId = getUrlVars().priceId.substr(0, getUrlVars().priceId.indexOf("#"));
    } else {
      paymentTransactionParameters.ssoPriceId = getUrlVars().priceId;
    }
  }
  if (getUrlVars().offerId) {
    if (getUrlVars().offerId.indexOf("#") > 0) {
      paymentTransactionParameters.ssoOfferId = getUrlVars().offerId.substr(0, getUrlVars().offerId.indexOf("#"));
    } else {
      paymentTransactionParameters.ssoOfferId = getUrlVars().offerId;
    }
  }
  if (getUrlVars().paymentType) {
    if (getUrlVars().paymentType.indexOf("#") > 0) {
      paymentTransactionParameters.ssoPaymentType = getUrlVars().paymentType.substr(0, getUrlVars().paymentType.indexOf("#"));
    } else {
      paymentTransactionParameters.ssoPaymentType = getUrlVars().paymentType;
    }
  }
  //if (getUrlVars().campaign) {
  //  if (getUrlVars().campaign.indexOf("#") > 0) {
  //    paymentTransactionParameters.externalCampaignId = getUrlVars().campaign.substr(0, getUrlVars().campaign.indexOf("#"));
  //  } else {
  //    paymentTransactionParameters.externalCampaignId = getUrlVars().campaign;
  //  }
  //}
  
  // B-24925 6ft - Add support to Campaign Functionality
  var queryString = getUrlVars();
  paymentTransactionParameters.externalCampaignId = (queryString.externalCampaignId) ? queryString.externalCampaignId: null;

  // passing catalog from sso url
  if (getUrlVars().catalog) {
    if (getUrlVars().catalog.indexOf("#") > 0) {
      paymentTransactionParameters.ssoCatalogType = getUrlVars().catalog.substr(0, getUrlVars().catalog.indexOf("#"));
    } else {
      paymentTransactionParameters.ssoCatalogType = getUrlVars().catalog;
    }
    storeParam.catalog = paymentTransactionParameters.ssoCatalogType;
  }

  // check SSO country field first
  if (getUrlVars().country) {
    if (getUrlVars().country.indexOf("#") > 0) {
      authenticatedInfo.countryIdentifier = getUrlVars().country.substr(0, getUrlVars().country.indexOf("#"));
    } else {
      authenticatedInfo.countryIdentifier = getUrlVars().country;
    }
  }

  if (getUrlVars().transactionId !== null && getUrlVars().transactionId !== "") {
    paymentTransactionParameters.externalTransactionId = getUrlVars().transactionId;
  }
};

var genFollowUpContent = function(followUpActionList) {
  var content = '';

  content = '<ul class="action-list">';

  $.each(followUpActionList, function(index, followUpAction) {
    // followUpActionList.type: NEW_PAYPAL_BILLING_AGREEMENT, MAKE_ONE_TIME_PAYPAL_PURCHASE, USE_ANOTHER_PAYMENT_METHOD
    var followUpType = followUpAction.type;

    if ( followUpAction.type == 'NEW_PAYPAL_BILLING_AGREEMENT' ) {
      content += '<li><span class="link follow-up-link" data-action="cpgPayPalPreApproved">' + $.localize('drog.store.new.paypal.billing.agreement') + '</span></li>';
    } else if ( followUpAction.type == 'MAKE_ONE_TIME_PAYPAL_PURCHASE' ) {
      content += '<li><span class="link follow-up-link" data-action="cpgPayPal">' + $.localize('drog.store.make.one.time.paypal.purchase') + '</span></li>';
    } else if ( followUpAction.type == 'USE_ANOTHER_PAYMENT_METHOD' ) {
      content += '<li><span class="link follow-up-link" data-action="cpgCreditCard">' + $.localize('drog.store.use.another.payment.method') + '</span></li>';
    }
  });

  content += '</ul>';

  return content;
};

// DROG-6571 handle followUpActionList when Payment Authorization Failed
function followUpAction(pmtOption) {
  $('.follow-up-overlay').hide();

  CheckState('#PaymentSelection');
  if ($('#method-list').find('option[for="' + pmtOption + '"]').length > 0) {
    $('#method-list').find('option[for="' + pmtOption + '"]').prop('selected', true).trigger('change');
  }

  paymentTransactionParameters.transactionStep = null;
}

// NOTE: keep for multiple payment forms [Vick]
// var deleteBtnHandler = function(action, display) {
//   var selectedPaymentOption = $('#select-paymentType option:selected');
//   var paymentOption_info = $(selectedPaymentOption).data('info');

//   if ( paymentOption_info && isStoredPaymentForm(paymentOption_info) ) {
//     $('.dr_paymentType .btn_removePayment').show();

//   } else {
//     $('.dr_paymentType .btn_removePayment').hide();
//   }
// };

// DROG-6720 & DROG-6950
var displayNoOfferMsg = function() {
  $('.modal').hide();
  $('.session-expire-modal .expire-text').text($.localize('drog.text.no.offers.available'));
  $('.session-expire-modal').show();
};

// B-17312 multiple payment form
var setPaymentOptions = function(paymentTypes, reload) {
  // reset all payment options
  var $paymentMethod = $('#method-list');
  $paymentMethod.data('payment-types', null);
  $('.paymentMethodBox').hide();
  paymentTransactionParameters.paymentFormId = null;
  arrPaymentGroupType = {};
  paymentTransactionParameters.hasDefaultPayment = false;

  genPaymentOptions(paymentTypes);

  $.each(paymentTypes, function(index, pmt) {
    var pmtOption = $paymentMethod.find('option[for=' + pmt.paymentType + ']');
    pmtOption.data('info', pmt);  
    processPaymentOption(pmt, pmtOption);

    if (pmt.defaultPayment) {
      // defaultPayment for recurring buyer, take scope != null
      if (!paymentTransactionParameters.recurringBuyer || (paymentTransactionParameters.recurringBuyer && (pmt.scope !== null))) {
        paymentTransactionParameters.hasDefaultPayment = true;
      }
    }

    if (reload) {
      // DROG-3381 reset SEPA info if user selects another country
      if (pmt.defaultPayment && pmt.paymentType == 'cpgSEPADirectDebit') {
        if ($("#sdd_bankAccountNumber").val().indexOf("*") != -1) {
          $("#sdd_bankRoutingCode, #sdd_bankAccountNumber").val("");
          $('#sdd_bankAccountNumber').rules('add', { sepa_validAccountNumber:true });
          paymentTransactionParameters.SDD.bankBillingInfoExternalId = null;
          $(".save input[for=cpgSEPADirectDebit]").removeAttr("checked");
        }
      }

      // DROG-4357 check if the bank ID exists
      if (pmt.defaultPayment && pmt.paymentType == 'cpgIBP') {
        // reset bank billing data
        paymentTransactionParameters.bankBilling.bankBillingInfoExternalId = null;
        $("#ibpBankName option").removeAttr('selected');
      }
    }
    arrPaymentGroupType[pmt.paymentType] = pmt.paymentGroupType;
  });

  $paymentMethod.data('payment-types', paymentTypes);
};

var setIBPBankOptions = function(banks) {
  if (banks && typeof banks !== 'undefined' && (banks.length > 0)) {
    var bank_select = $("#ibpBankName");
    bank_select.html("");

    for (var index in banks) {
      var bank = banks[index];
      bank_select.append($("<option></option>").text(bank.bankName).attr({'bank-id':bank.bankId,'bank-name':bank.bankName}).data('bank-id', bank.bankId));
    }

    $(bank_select).data("banks", banks);
  }
};

// NOTE: keep for delete store payment feature [Vick]
// var removeStoredPaymentOption = function() {
//   var payment_id = paymentTransactionParameters.paymentFormId;
//   var billingData = getBillingData(payment_id, true);

//   $.ajax({
//     type: config.debug ? "GET" : "POST",
//     url: apiPath.paymentUpdateUrl() + getHeaderParams(),
//     xhrFields: { 
//       withCredentials: true 
//     },
//     dataType: config.default_dataType,
//     contentType: getContentType(),
//     jsonpCallback: "callback",
//     data: JSON.stringify(billingData),
//     beforeSend : setHeader
//   })
//   .fail(function(xhr, ajaxOptions, thrownError) {
//     if ( console && console.log ) {
//       console.log("url: " + apiPath.paymentUpdateUrl());
//       console.log("fn removeStoredPaymentOption xhr.status: " + xhr.status);
//       console.log("fn removeStoredPaymentOption xhr.responseText: " + xhr.responseText);
//       console.log("fn removeStoredPaymentOption thrownError: " + thrownError);
//     }
//   })
//   .done(function(data) {
//     if ( $('#select-paymentType option[value="' + payment_id + '"]').length <= 1 ) {
//       var blank_paymentOption = $('#select-paymentType-hidden option[value="' + payment_id + '"]').clone();
//       var paymentInfo = {
//         paymentType: payment_id
//       };
//       var paymentIndex = $('#select-paymentType option:selected').data('index');
//       $(blank_paymentOption).data('info', paymentInfo).data('index', paymentIndex);
//       $('#select-paymentType option:selected').after(blank_paymentOption);
//     }

//     $('#select-paymentType option:selected').remove();
//     $('#select-paymentType').trigger('change');
//   });
  
// };

// TODO update the conditions to determine if it is the stored payment form
var isStoredPaymentForm = function(pmt) {
  var isStored = false;
  if ( pmt && pmt.paymentType ) {
    var paymentType = pmt.paymentType;
    
    if ( paymentType == 'cpgPayPalPreApproved' && (typeof pmt.referencedBillingInfoExternalId !== "undefined") && (pmt.referencedBillingInfoExternalId !== null)) {
      isStored = true;
    } else if ( paymentType != 'cpgPayPalPreApproved' && (typeof pmt.paymentInfoExternalId !== "undefined") && (pmt.paymentInfoExternalId !== null)) {
      isStored = true;
    }
  }

  return isStored;
};

// NOTE: keep for multiple payment forms [Vick]
// var resetPaymentFormInput = function(paymentType) {
//   $('.payment-form').find('input, select').val('');
//   // var month = new Date().getMonth() + 1;
//   // $('#cardExpirationMonth').val(month);
//   // $('.dr_paymentDetail .dr_paymentMethodBox select').trigger('render');
//   // $('.card-type-wrapper .card-type').removeClass('selected');

//   // add validation rules
//   if (!$('#cardNumber').rules().supportedCard) {
//     $('#cardNumber').rules('add', {
//       supportedCard: true
//     });
//   }

//   if (!$('#sdd_bankAccountNumber').rules().sepa_validAccountNumber) {
//     $('#sdd_bankAccountNumber').rules('add', {
//       sepa_validAccountNumber: true
//     });
//   }

//   if (!$('#cardSecurityCode').rules()['number']) {
//     $('#cardSecurityCode').rules('add', {
//       number: true
//     });
//   }
// };

// D-04739
var securityCodeLength = function(CCType) {
  var codeLength = (CCType == 'AMEX')? 4 : 3;
  var $cardSecurityCode = $('#cardSecurityCode');

  $cardSecurityCode.rules('remove','maxlength');
  $cardSecurityCode.rules('add',{ maxlength: codeLength});
  $cardSecurityCode.rules('remove',',minlength');
  $cardSecurityCode.rules('add',{ minlength: codeLength});
  $cardSecurityCode.attr('maxlength', codeLength);
};

// TODO selectedOffer.prices[0].paymentForms filter

var metaDataHandler = function(data) {
  // store properties
  storeProperties = data.storeProperties;

  // terms and conditions link
  var terms = data.termsConditions;
  paymentTransactionParameters.terms = terms;
  displayTermsAndConditionLinks(terms);

  var $countrySelect = $('#country');
  $.each(data.countries, function(index, country) {
     $countrySelect.append(
      $('<option></option>').val(country.shortDescription).html(country.localizedName).data('states', country.states).attr('data-text', country.localizedName)
     );
  });
};

// B-19032 B-20779 
var isPhoneNumShow = function(payment_id) {
  var _isPhoneShow = false;

  if ( payment_id == 'cpgPayEasy' ) {
    _isPhoneShow = true;
  } else if ( payment_id == 'cpgKonbini' ) {
    if ( $('input:radio[name="konbini_stores"]').is(':checked') && $('input[name="konbini_stores"]:checked').val() != '010' ) {
      _isPhoneShow = true;
    }
  }
  var $phone = $('#phone');
  if( _isPhoneShow ) {
    $phone.rules('add',{ required:true });
  } else {
    //reset phone field
    $phone.rules('remove', 'required');
    if ( $phone.hasClass('invalid') ) {
      $phone.removeClass('invalid');
    }
    if ($('.purchase-summary-modal .button.next').hasClass('disabled')) {
      $('#payment-form').submit();
    }
  }
  
  return _isPhoneShow;
};

var purchaseInstructionHandler = function() {
  var payment_id = paymentTransactionParameters.paymentFormId;
  var content = '';
  var authorizationCode = paymentTransactionParameters.authorizationCode,
      redirectURL = paymentTransactionParameters.redirectURL;

  if ( payment_id == 'cpgKonbini' ) {
    if ( authorizationCode ) {
      content += '<div>' + 
                    '<span class="title">' + $.localize("drog.convenience.store.payment.number") + ': </span>' + 
                    authorizationCode + 
                  '</div>';
    }

    content += '<div>' + 
                  '<span class="title">' + $.localize("drog.convenience.store.name") + ': </span>' + 
                  $('input[name="konbini_stores"]:checked').data('name') + 
                '</div>';

    if ( redirectURL ) {
      content += '<div>' + 
                    '<span class="title">' + $.localize("drog.convenience.store.payment.slip.url") + ': </span>' + 
                    '<a href="' + redirectURL + ' target="_blank">' + redirectURL + '</a>' +
                  '</div>';
    }

    var store_referenceEntityId = paymentTransactionParameters.referencedBilling.referenceEntityId,
    instructionsKey = "drog.convenience.store.instructions" + store_referenceEntityId;
    content += '<div>' + 
                  $.localize(instructionsKey) + 
                '</div>';

  } else if ( payment_id == 'cpgPayEasy' ) {
    content += '<div>' +
                  '<span class="title">' + $.localize("drog.payeasy.text.vendor.code") + ': </span>' +
                  $.localize("drog.payeasy.vendor.code") +
                '</div>' +
                '<div>' +
                  '<span class="title">' + $.localize("drog.payeasy.text.phone.number") + ': </span>' +
                  paymentTransactionParameters.addressInfo.phone +
                '</div>' +
                '<div>' +
                  '<span class="title">' + $.localize("drog.payeasy.text.confirmation.number") + ': </span>' +
                  authorizationCode +
                '</div>' +
                '<div>' +
                  $.localize("drog.payeasy.instructions") +
                '</div>';
  } else if ( payment_id == 'cpgSevenElevenShop' ) {
    content += '<div>' +
                  '<span class="title">' + $.localize("drog.seveneleven.text.authorization.code") + ': </span>' +
                  authorizationCode +
                '</div>' +
                '<div>' +
                  '<span class="title">' + $.localize("drog.seveneleven.text.amount.total") + ': </span>' +
                  formatedPrice(paymentTransactionParameters.amountTotal) +
                '</div>' +
                '<div>' +
                  '<span class="title">' + $.localize("drog.seveneleven.text.expiration.date") + ': </span>' +
                  paymentTransactionParameters.expirationDate +
                '</div>';

    if ( redirectURL ) {
      content += '<div>' +
                    generateRedirectURL(redirectURL) +
                  '</div>';
    }
                
  }

  $('.thank-you-modal .purchaseInstruction').html(content).show();
};

// D-06742
var genPaymentOptions = function(paymentTypes) {
  var $methodList = $('#method-list');
  var $methodListHidden = $('#method-list-hidden');

  // Clone the default option: ----
  $methodList.empty().append($methodListHidden.find('option:first').clone());
  
  $.each(paymentTypes, function(index, pmt) {
    // there is no multiplePaymentForm feature in 6ft
    if ($methodList.find('option[for=' + pmt.paymentType + ']').length === 0) {
      var pmtOption = $methodListHidden.find('option[for=' + pmt.paymentType + ']').clone();
      var optionIndex = pmtOption.data('index');

      // Sort the order of payment options
      $.each($methodList.find('option'), function(index, opt) {
        if ($(opt).data('index') > optionIndex) {
          $(opt).before(pmtOption);
          return false;
        }
      });

      if ($methodList.find('option[for=' + pmt.paymentType + ']').length === 0) {
        $methodList.append(pmtOption);
      }
    } 
  });
};

// D-06799 Online banking and Sepa require EUR currency. So we should only show when "country=available country" and currency=EUR
var updatePaymentOptionsByCurrency = function(currency, arrRestrictedPayment) {
  if (paymentTransactionParameters.currencyIdentifier !== currency) {
    $.each(arrRestrictedPayment, function(index, pmtName) {
      var pmtOption = $('#method-list').find('option[for=' + pmtName + ']');
      if (pmtOption.length > 0) {
        pmtOption.remove();
        $('#method-list').trigger('change');
      }
    });
  }
};

var progressBarHandler = function(action) {
  var $progressbar = $('.progress-bar-list');

  if (action === 'hide') {
    $progressbar.hide();
  } else if (action && action.indexOf('step-') !== -1) {
    var stepNum = parseInt(action.split('step-')[1]);

    $progressbar.find('li').removeAttr('class');

    for (var i = 0; i < stepNum; i++) {
      var className = 'active';

      if (i == stepNum - 1) {
        className += ' highlight';
      }

      $progressbar.find('li').eq(i).addClass(className);
    }
  }
};