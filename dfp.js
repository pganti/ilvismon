var SlotsWithAdResponses = {};
 var SlotsWithAdLoaded = {};
 var SlotsWithAdViewable = {};
 // Used to inform of new ad slot ids, as they are collected
 function GetDFPAdSlotInfo() {
   return ({
     "SlotsWithAdResponses": Object.keys(SlotsWithAdResponses),
     "SlotsWithAdLoaded": Object.keys(SlotsWithAdLoaded),
     "SlotsWithAdViewable": Object.keys(SlotsWithAdViewable)
   });
 }
 var DFPListenerInstaller;
 var NavigationStart = -1;
 var SlotTimingsMap = {};
 var DFPListenersInstalled = false;
 function GetSlotTimings() {
   var slotTimings = [];
   for (var slot in SlotTimingsMap) {
     slotTimings.push(SlotTimingsMap[slot]);
   }
   return slotTimings;
 }
 function AddSlotToMap(slotId) {
   if (!SlotTimingsMap[slotId]) {
     var dFPAdSlotTimingsInfo = {};
     dFPAdSlotTimingsInfo["SlotId"] = slotId;
     SlotTimingsMap[slotId] = dFPAdSlotTimingsInfo;
   }
 }
 function AddIdsToMapIfNotPresent(event, slotId) {
   // let slotId: string = slotId + ":" + cId + ":" + aId + ":" + lId;
   if (!SlotTimingsMap[slotId]["CreativeId"]) {
     SlotTimingsMap[slotId]["CreativeId"] = event["creativeId"];
   }
   if (!SlotTimingsMap[slotId]["AdvertiseId"]) {
     SlotTimingsMap[slotId]["AdvertiserId"] = event["advertiserId"];
   }
   if (!SlotTimingsMap[slotId]["LineItemId"]) {
     SlotTimingsMap[slotId]["LineItemId"] = event["lineItemId"];
   }
 }
 var InstallDFPListeners = function () {
   var googleTag = window["googletag"];
   var pubAds = googleTag && googleTag["pubads"] && (typeof googleTag["pubads"] === "function") && googleTag["pubads"]();
   var aListener = pubAds && pubAds["addEventListener"] && (typeof pubAds["addEventListener"] === "function");
   if (aListener) {
     try {
       // https://developers.google.com/doubleclick-gpt/reference#googletag.events.SlotRenderEndedEvent
       pubAds["addEventListener"]('slotRenderEnded', function (event) {
         var slotId = event["slot"] && event["slot"]["getSlotElementId"]();
         AddSlotToMap(slotId);
         AddIdsToMapIfNotPresent(event, slotId);
         console.log('Slot has been rendered: ' + slotId);
  
         if (!event["isEmpty"]) {
           SlotsWithAdResponses[slotId] = true;
         }
         SlotTimingsMap[slotId]["IsCreativeEmpty"] = event["isEmpty"];
         if (!SlotTimingsMap[slotId]["CreativeCodeFetchedTimeMs"]) {
           SlotTimingsMap[slotId]["CreativeCodeFetchedTimeMs"] = (Date.now() - NavigationStart);
         }
       });
       pubAds["addEventListener"]('slotVisibilityChanged', function (event) {
         var slotId = event["slot"] && event["slot"]["getSlotElementId"]();
         AddSlotToMap(slotId);
         AddIdsToMapIfNotPresent(event, slotId);
         console.log('Slot visibility changed ' + slotId);
         if (SlotsWithAdResponses[slotId]) {
           // We only record subsequent events if
           // the slot actually had a creative
           SlotsWithAdViewable[slotId] = true;
         }
         if (!SlotTimingsMap[slotId]["CreativeVisibilityChangedTimeMs"]) {
           SlotTimingsMap[slotId]["CreativeVisibilityChangedTimeMs"] = (Date.now() - NavigationStart);
         }
       });
       // https://developers.google.com/doubleclick-gpt/reference#googletag.events.SlotOnloadEvent
       pubAds["addEventListener"]('slotOnload', function (event) {
         var slotId = event["slot"] && event["slot"]["getSlotElementId"]();
         AddSlotToMap(slotId);
         AddIdsToMapIfNotPresent(event, slotId);
         console.log('Slot has been loaded: ' + slotId);
 
         if (SlotsWithAdResponses[slotId]) {
           SlotsWithAdLoaded[slotId] = true;
         }
         SlotTimingsMap[slotId]["CreativeLoadedTimeMs"] = (Date.now() - NavigationStart);
       });
       pubAds["addEventListener"]('impressionViewable', function (event) {
         var slotId = event["slot"] && event["slot"]["getSlotElementId"]();
         AddSlotToMap(slotId);
         AddIdsToMapIfNotPresent(event, slotId); 
         if (SlotsWithAdResponses[slotId]) {
           SlotsWithAdViewable[slotId] = true;
         }
         SlotTimingsMap[slotId]["CreativeViewableTimeMs"] = (Date.now() - NavigationStart);
         console.log(`Slot has a viewable impression: ${slotId} at  ${Date.now() - NavigationStart} milliseconds from reqstart`);
         console.table(SlotTimingsMap);
         console.table(GetDFPAdSlotInfo());
       });
       DFPListenerInstaller && window.clearInterval(DFPListenerInstaller);
       DFPListenersInstalled = true;
     }
     catch (ex) {
     }
   }
 };
 if (window.performance && window.performance.timing && window.performance.timing.requestStart) {
   NavigationStart = window.performance.timing.requestStart;
 }
 if (window === window.top) {
   InstallDFPListeners();
   var keys = googletag.pubads().getTargetingKeys();
   var arrayLength = keys.length;
   console.log("Dumping page level key values")
   var table = {};
   for (var i = 0; i < arrayLength; i++) {
       table[keys[i]] = googletag.pubads().getTargeting(keys[i]);
   }
   console.table(table);
   if (!DFPListenersInstalled) {
     DFPListenerInstaller = window.setInterval(InstallDFPListeners, 1000);
   }
   var performance = window.performance || window.webkitPerformance || window.msPerformance || window.mozPerformance;
   var timing = performance.timing;
   var api = {};
   
   // DNS query time
   api.lookupDomainTime = timing.domainLookupEnd - timing.domainLookupStart;
   // TCP connection time
   api.connectTime = timing.connectEnd - timing.connectStart;
   // Time spent during the request
   api.requestTime = timing.responseEnd - timing.requestStart;
   // Request to completion of the DOM loading
   api.initDomTreeTime = timing.domInteractive - timing.responseEnd;
   // Load event time
   api.loadEventTime = timing.loadEventEnd - timing.loadEventStart;

   var table = {};
   Object.keys(api).sort().forEach(function(k) {
     table[k] = {
        seconds : +((api[k] / 1000).toFixed(2))
     };
    });
   console.table(table);
 };
