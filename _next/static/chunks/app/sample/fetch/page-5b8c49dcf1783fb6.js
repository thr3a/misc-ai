(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[712],{8567:function(t,e,r){Promise.resolve().then(r.bind(r,5119))},5119:function(t,e,r){"use strict";let n;r.r(e),r.d(e,{default:function(){return _}});var s=r(7437),i=r(300),u=r(7987),o=r(9198),c=r(2996),a=r(1640),l=class extends c.l{constructor(t,e){super(),this.#t=void 0,this.#e=void 0,this.#r=void 0,this.#n=new Set,this.#s=t,this.options=e,this.#i=null,this.bindMethods(),this.setOptions(e)}#s;#t;#e;#r;#u;#o;#i;#c;#a;#l;#h;#f;#d;#n;bindMethods(){this.refetch=this.refetch.bind(this)}onSubscribe(){1===this.listeners.size&&(this.#t.addObserver(this),h(this.#t,this.options)&&this.#p(),this.#y())}onUnsubscribe(){this.hasListeners()||this.destroy()}shouldFetchOnReconnect(){return f(this.#t,this.options,this.options.refetchOnReconnect)}shouldFetchOnWindowFocus(){return f(this.#t,this.options,this.options.refetchOnWindowFocus)}destroy(){this.listeners=new Set,this.#v(),this.#b(),this.#t.removeObserver(this)}setOptions(t,e){let r=this.options,n=this.#t;if(this.options=this.#s.defaultQueryOptions(t),(0,i.VS)(r,this.options)||this.#s.getQueryCache().notify({type:"observerOptionsUpdated",query:this.#t,observer:this}),void 0!==this.options.enabled&&"boolean"!=typeof this.options.enabled)throw Error("Expected enabled to be a boolean");this.options.queryKey||(this.options.queryKey=r.queryKey),this.#R();let s=this.hasListeners();s&&d(this.#t,n,this.options,r)&&this.#p(),this.updateResult(e),s&&(this.#t!==n||this.options.enabled!==r.enabled||this.options.staleTime!==r.staleTime)&&this.#m();let u=this.#w();s&&(this.#t!==n||this.options.enabled!==r.enabled||u!==this.#d)&&this.#O(u)}getOptimisticResult(t){let e=this.#s.getQueryCache().build(this.#s,t),r=this.createResult(e,t);return(0,i.VS)(this.getCurrentResult(),r)||(this.#r=r,this.#o=this.options,this.#u=this.#t.state),r}getCurrentResult(){return this.#r}trackResult(t){let e={};return Object.keys(t).forEach(r=>{Object.defineProperty(e,r,{configurable:!1,enumerable:!0,get:()=>(this.#n.add(r),t[r])})}),e}getCurrentQuery(){return this.#t}refetch({...t}={}){return this.fetch({...t})}fetchOptimistic(t){let e=this.#s.defaultQueryOptions(t),r=this.#s.getQueryCache().build(this.#s,e);return r.isFetchingOptimistic=!0,r.fetch().then(()=>this.createResult(r,e))}fetch(t){return this.#p({...t,cancelRefetch:t.cancelRefetch??!0}).then(()=>(this.updateResult(),this.#r))}#p(t){this.#R();let e=this.#t.fetch(this.options,t);return t?.throwOnError||(e=e.catch(i.ZT)),e}#m(){if(this.#v(),i.sk||this.#r.isStale||!(0,i.PN)(this.options.staleTime))return;let t=(0,i.Kp)(this.#r.dataUpdatedAt,this.options.staleTime);this.#h=setTimeout(()=>{this.#r.isStale||this.updateResult()},t+1)}#w(){return("function"==typeof this.options.refetchInterval?this.options.refetchInterval(this.#r.data,this.#t):this.options.refetchInterval)??!1}#O(t){this.#b(),this.#d=t,!i.sk&&!1!==this.options.enabled&&(0,i.PN)(this.#d)&&0!==this.#d&&(this.#f=setInterval(()=>{(this.options.refetchIntervalInBackground||o.j.isFocused())&&this.#p()},this.#d))}#y(){this.#m(),this.#O(this.#w())}#v(){this.#h&&(clearTimeout(this.#h),this.#h=void 0)}#b(){this.#f&&(clearInterval(this.#f),this.#f=void 0)}createResult(t,e){let r;let n=this.#t,s=this.options,u=this.#r,o=this.#u,c=this.#o,l=t!==n,f=l?t.state:this.#e,{state:y}=t,{error:v,errorUpdatedAt:b,fetchStatus:R,status:m}=y,w=!1;if(e._optimisticResults){let r=this.hasListeners(),i=!r&&h(t,e),u=r&&d(t,n,e,s);(i||u)&&(R=(0,a.Kw)(t.options.networkMode)?"fetching":"paused",y.dataUpdatedAt||(m="pending")),"isRestoring"===e._optimisticResults&&(R="idle")}if(e.select&&void 0!==y.data){if(u&&y.data===o?.data&&e.select===this.#c)r=this.#a;else try{this.#c=e.select,r=e.select(y.data),r=(0,i.oE)(u?.data,r,e),this.#a=r,this.#i=null}catch(t){this.#i=t}}else r=y.data;if(void 0!==e.placeholderData&&void 0===r&&"pending"===m){let t;if(u?.isPlaceholderData&&e.placeholderData===c?.placeholderData)t=u.data;else if(t="function"==typeof e.placeholderData?e.placeholderData(this.#l?.state.data,this.#l):e.placeholderData,e.select&&void 0!==t)try{t=e.select(t),this.#i=null}catch(t){this.#i=t}void 0!==t&&(m="success",r=(0,i.oE)(u?.data,t,e),w=!0)}this.#i&&(v=this.#i,r=this.#a,b=Date.now(),m="error");let O="fetching"===R,E="pending"===m,g="error"===m,S=E&&O,Q={status:m,fetchStatus:R,isPending:E,isSuccess:"success"===m,isError:g,isInitialLoading:S,isLoading:S,data:r,dataUpdatedAt:y.dataUpdatedAt,error:v,errorUpdatedAt:b,failureCount:y.fetchFailureCount,failureReason:y.fetchFailureReason,errorUpdateCount:y.errorUpdateCount,isFetched:y.dataUpdateCount>0||y.errorUpdateCount>0,isFetchedAfterMount:y.dataUpdateCount>f.dataUpdateCount||y.errorUpdateCount>f.errorUpdateCount,isFetching:O,isRefetching:O&&!E,isLoadingError:g&&0===y.dataUpdatedAt,isPaused:"paused"===R,isPlaceholderData:w,isRefetchError:g&&0!==y.dataUpdatedAt,isStale:p(t,e),refetch:this.refetch};return Q}updateResult(t){let e=this.#r,r=this.createResult(this.#t,this.options);if(this.#u=this.#t.state,this.#o=this.options,(0,i.VS)(r,e))return;void 0!==this.#u.data&&(this.#l=this.#t),this.#r=r;let n={};t?.listeners!==!1&&(()=>{if(!e)return!0;let{notifyOnChangeProps:t}=this.options,r="function"==typeof t?t():t;if("all"===r||!r&&!this.#n.size)return!0;let n=new Set(r??this.#n);return this.options.throwOnError&&n.add("error"),Object.keys(this.#r).some(t=>{let r=this.#r[t]!==e[t];return r&&n.has(t)})})()&&(n.listeners=!0),this.#E({...n,...t})}#R(){let t=this.#s.getQueryCache().build(this.#s,this.options);if(t===this.#t)return;let e=this.#t;this.#t=t,this.#e=t.state,this.hasListeners()&&(e?.removeObserver(this),t.addObserver(this))}onQueryUpdate(){this.updateResult(),this.hasListeners()&&this.#y()}#E(t){u.V.batch(()=>{t.listeners&&this.listeners.forEach(t=>{t(this.#r)}),this.#s.getQueryCache().notify({query:this.#t,type:"observerResultsUpdated"})})}};function h(t,e){return!1!==e.enabled&&!t.state.dataUpdatedAt&&!("error"===t.state.status&&!1===e.retryOnMount)||t.state.dataUpdatedAt>0&&f(t,e,e.refetchOnMount)}function f(t,e,r){if(!1!==e.enabled){let n="function"==typeof r?r(t):r;return"always"===n||!1!==n&&p(t,e)}return!1}function d(t,e,r,n){return!1!==r.enabled&&(t!==e||!1===n.enabled)&&(!r.suspense||"error"!==t.state.status)&&p(t,r)}function p(t,e){return t.isStaleByTime(e.staleTime)}var y=r(2265),v=y.createContext((n=!1,{clearReset:()=>{n=!1},reset:()=>{n=!0},isReset:()=>n})),b=()=>y.useContext(v),R=r(8038),m=y.createContext(!1),w=()=>y.useContext(m);m.Provider;var O=(t,e)=>{(t.suspense||t.throwOnError)&&!e.isReset()&&(t.retryOnMount=!1)},E=t=>{y.useEffect(()=>{t.clearReset()},[t])},g=({result:t,errorResetBoundary:e,throwOnError:r,query:n})=>{var s;return t.isError&&!e.isReset()&&!t.isFetching&&(s=[t.error,n],"function"==typeof r?r(...s):!!r)},S=(t,e)=>void 0===e.state.data,Q=t=>{t.suspense&&"number"!=typeof t.staleTime&&(t.staleTime=1e3)},C=(t,e)=>t.isLoading&&t.isFetching&&!e,I=(t,e,r)=>t?.suspense&&C(e,r),k=(t,e,r)=>e.fetchOptimistic(t).catch(()=>{r.clearReset()});let F=async()=>{let t=await fetch("https://mocki.io/v1/178a3315-be2e-416b-ad47-ee28b99cdd7d");return await t.json()},L=()=>{let{data:t}=function(t,e,r){let n=(0,R.NL)(r),s=w(),i=b(),o=n.defaultQueryOptions(t);o._optimisticResults=s?"isRestoring":"optimistic",Q(o),O(o,i),E(i);let[c]=y.useState(()=>new e(n,o)),a=c.getOptimisticResult(o);if(y.useSyncExternalStore(y.useCallback(t=>{let e=s?()=>void 0:c.subscribe(u.V.batchCalls(t));return c.updateResult(),e},[c,s]),()=>c.getCurrentResult(),()=>c.getCurrentResult()),y.useEffect(()=>{c.setOptions(o,{listeners:!1})},[o,c]),I(o,a,s))throw k(o,c,i);if(g({result:a,errorResetBoundary:i,throwOnError:o.throwOnError,query:c.getCurrentQuery()}))throw a.error;return o.notifyOnChangeProps?a:c.trackResult(a)}({queryKey:["repo","facebook"],queryFn:async()=>await F(),enabled:!0,suspense:!0,throwOnError:S},l,void 0);return t},P=()=>{let t=L();return(0,s.jsx)(s.Fragment,{children:t.map((t,e)=>(0,s.jsxs)("p",{children:[t.name," / ",t.description]},e))})};function _(){return(0,s.jsx)(y.Suspense,{fallback:(0,s.jsx)("div",{children:"Loading..."}),children:(0,s.jsx)(P,{})})}},622:function(t,e,r){"use strict";/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var n=r(2265),s=Symbol.for("react.element"),i=Symbol.for("react.fragment"),u=Object.prototype.hasOwnProperty,o=n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,c={key:!0,ref:!0,__self:!0,__source:!0};function a(t,e,r){var n,i={},a=null,l=null;for(n in void 0!==r&&(a=""+r),void 0!==e.key&&(a=""+e.key),void 0!==e.ref&&(l=e.ref),e)u.call(e,n)&&!c.hasOwnProperty(n)&&(i[n]=e[n]);if(t&&t.defaultProps)for(n in e=t.defaultProps)void 0===i[n]&&(i[n]=e[n]);return{$$typeof:s,type:t,key:a,ref:l,props:i,_owner:o.current}}e.Fragment=i,e.jsx=a,e.jsxs=a},7437:function(t,e,r){"use strict";t.exports=r(622)},9198:function(t,e,r){"use strict";r.d(e,{j:function(){return i}});var n=r(2996),s=r(300),i=new class extends n.l{#g;#S;#Q;constructor(){super(),this.#Q=t=>{if(!s.sk&&window.addEventListener){let e=()=>t();return window.addEventListener("visibilitychange",e,!1),()=>{window.removeEventListener("visibilitychange",e)}}}}onSubscribe(){this.#S||this.setEventListener(this.#Q)}onUnsubscribe(){this.hasListeners()||(this.#S?.(),this.#S=void 0)}setEventListener(t){this.#Q=t,this.#S?.(),this.#S=t(t=>{"boolean"==typeof t?this.setFocused(t):this.onFocus()})}setFocused(t){let e=this.#g!==t;e&&(this.#g=t,this.onFocus())}onFocus(){this.listeners.forEach(t=>{t()})}isFocused(){return"boolean"==typeof this.#g?this.#g:globalThis.document?.visibilityState!=="hidden"}}},7987:function(t,e,r){"use strict";r.d(e,{V:function(){return s}});var n=r(300),s=function(){let t=[],e=0,r=t=>{t()},s=t=>{t()},i=s=>{e?t.push(s):(0,n.A4)(()=>{r(s)})},u=()=>{let e=t;t=[],e.length&&(0,n.A4)(()=>{s(()=>{e.forEach(t=>{r(t)})})})};return{batch:t=>{let r;e++;try{r=t()}finally{--e||u()}return r},batchCalls:t=>(...e)=>{i(()=>{t(...e)})},schedule:i,setNotifyFunction:t=>{r=t},setBatchNotifyFunction:t=>{s=t}}}()},436:function(t,e,r){"use strict";r.d(e,{N:function(){return i}});var n=r(2996),s=r(300),i=new class extends n.l{#C=!0;#S;#Q;constructor(){super(),this.#Q=t=>{if(!s.sk&&window.addEventListener){let e=()=>t(!0),r=()=>t(!1);return window.addEventListener("online",e,!1),window.addEventListener("offline",r,!1),()=>{window.removeEventListener("online",e),window.removeEventListener("offline",r)}}}}onSubscribe(){this.#S||this.setEventListener(this.#Q)}onUnsubscribe(){this.hasListeners()||(this.#S?.(),this.#S=void 0)}setEventListener(t){this.#Q=t,this.#S?.(),this.#S=t(this.setOnline.bind(this))}setOnline(t){let e=this.#C!==t;e&&(this.#C=t,this.listeners.forEach(e=>{e(t)}))}isOnline(){return this.#C}}},1640:function(t,e,r){"use strict";r.d(e,{DV:function(){return a},Kw:function(){return o},Mz:function(){return l}});var n=r(9198),s=r(436),i=r(300);function u(t){return Math.min(1e3*2**t,3e4)}function o(t){return(t??"online")!=="online"||s.N.isOnline()}var c=class{constructor(t){this.revert=t?.revert,this.silent=t?.silent}};function a(t){return t instanceof c}function l(t){let e,r,a,l=!1,h=0,f=!1,d=new Promise((t,e)=>{r=t,a=e}),p=()=>!n.j.isFocused()||"always"!==t.networkMode&&!s.N.isOnline(),y=n=>{f||(f=!0,t.onSuccess?.(n),e?.(),r(n))},v=r=>{f||(f=!0,t.onError?.(r),e?.(),a(r))},b=()=>new Promise(r=>{e=t=>{let e=f||!p();return e&&r(t),e},t.onPause?.()}).then(()=>{e=void 0,f||t.onContinue?.()}),R=()=>{let e;if(!f){try{e=t.fn()}catch(t){e=Promise.reject(t)}Promise.resolve(e).then(y).catch(e=>{if(f)return;let r=t.retry??(i.sk?0:3),n=t.retryDelay??u,s="function"==typeof n?n(h,e):n,o=!0===r||"number"==typeof r&&h<r||"function"==typeof r&&r(h,e);if(l||!o){v(e);return}h++,t.onFail?.(h,e),(0,i._v)(s).then(()=>{if(p())return b()}).then(()=>{l?v(e):R()})})}};return o(t.networkMode)?R():b().then(R),{promise:d,cancel:e=>{f||(v(new c(e)),t.abort?.())},continue:()=>{let t=e?.();return t?d:Promise.resolve()},cancelRetry:()=>{l=!0},continueRetry:()=>{l=!1}}}},2996:function(t,e,r){"use strict";r.d(e,{l:function(){return n}});var n=class{constructor(){this.listeners=new Set,this.subscribe=this.subscribe.bind(this)}subscribe(t){return this.listeners.add(t),this.onSubscribe(),()=>{this.listeners.delete(t),this.onUnsubscribe()}}hasListeners(){return this.listeners.size>0}onSubscribe(){}onUnsubscribe(){}}},300:function(t,e,r){"use strict";r.d(e,{A4:function(){return R},Ht:function(){return O},Kp:function(){return o},PN:function(){return u},Rm:function(){return l},SE:function(){return i},VS:function(){return d},VX:function(){return w},X7:function(){return a},Ym:function(){return h},ZT:function(){return s},_v:function(){return b},_x:function(){return c},oE:function(){return m},sk:function(){return n},to:function(){return f}});var n="undefined"==typeof window||"Deno"in window;function s(){}function i(t,e){return"function"==typeof t?t(e):t}function u(t){return"number"==typeof t&&t>=0&&t!==1/0}function o(t,e){return Math.max(t+(e||0)-Date.now(),0)}function c(t,e){let{type:r="all",exact:n,fetchStatus:s,predicate:i,queryKey:u,stale:o}=t;if(u){if(n){if(e.queryHash!==l(u,e.options))return!1}else if(!f(e.queryKey,u))return!1}if("all"!==r){let t=e.isActive();if("active"===r&&!t||"inactive"===r&&t)return!1}return("boolean"!=typeof o||e.isStale()===o)&&(void 0===s||s===e.state.fetchStatus)&&(!i||!!i(e))}function a(t,e){let{exact:r,status:n,predicate:s,mutationKey:i}=t;if(i){if(!e.options.mutationKey)return!1;if(r){if(h(e.options.mutationKey)!==h(i))return!1}else if(!f(e.options.mutationKey,i))return!1}return(!n||e.state.status===n)&&(!s||!!s(e))}function l(t,e){let r=e?.queryKeyHashFn||h;return r(t)}function h(t){return JSON.stringify(t,(t,e)=>y(e)?Object.keys(e).sort().reduce((t,r)=>(t[r]=e[r],t),{}):e)}function f(t,e){return t===e||typeof t==typeof e&&!!t&&!!e&&"object"==typeof t&&"object"==typeof e&&!Object.keys(e).some(r=>!f(t[r],e[r]))}function d(t,e){if(t&&!e||e&&!t)return!1;for(let r in t)if(t[r]!==e[r])return!1;return!0}function p(t){return Array.isArray(t)&&t.length===Object.keys(t).length}function y(t){if(!v(t))return!1;let e=t.constructor;if(void 0===e)return!0;let r=e.prototype;return!!(v(r)&&r.hasOwnProperty("isPrototypeOf"))}function v(t){return"[object Object]"===Object.prototype.toString.call(t)}function b(t){return new Promise(e=>{setTimeout(e,t)})}function R(t){b(0).then(t)}function m(t,e,r){return"function"==typeof r.structuralSharing?r.structuralSharing(t,e):!1!==r.structuralSharing?function t(e,r){if(e===r)return e;let n=p(e)&&p(r);if(n||y(e)&&y(r)){let s=n?e.length:Object.keys(e).length,i=n?r:Object.keys(r),u=i.length,o=n?[]:{},c=0;for(let s=0;s<u;s++){let u=n?s:i[s];o[u]=t(e[u],r[u]),o[u]===e[u]&&c++}return s===u&&c===s?e:o}return r}(t,e):e}function w(t,e,r=0){let n=[...t,e];return r&&n.length>r?n.slice(1):n}function O(t,e,r=0){let n=[e,...t];return r&&n.length>r?n.slice(0,-1):n}},8038:function(t,e,r){"use strict";r.d(e,{NL:function(){return i},aH:function(){return u}});var n=r(2265),s=n.createContext(void 0),i=t=>{let e=n.useContext(s);if(t)return t;if(!e)throw Error("No QueryClient set, use QueryClientProvider to set one");return e},u=({client:t,children:e})=>(n.useEffect(()=>(t.mount(),()=>{t.unmount()}),[t]),n.createElement(s.Provider,{value:t},e))}},function(t){t.O(0,[971,864,744],function(){return t(t.s=8567)}),_N_E=t.O()}]);