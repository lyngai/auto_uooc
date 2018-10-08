// web请求监听，最后一个参数表示阻塞式，需单独声明权限：webRequestBlocking
// chrome.webRequest.onBeforeRequest.addListener(details => {
//     // cancel 表示取消本次请求
//     // if(!showImage && details.type == 'image') return {cancel: true};
//     // 简单的音视频检测
//     // 大部分网站视频的type并不是media，且视频做了防下载处理，所以这里仅仅是为了演示效果，无实际意义
//     // if(details.type == 'xmlhttprequest') {
//     //     chrome.notifications.create(null, {
//     //         type: 'basic',
//     //         iconUrl: 'icon/48.png',
//     //         title: '检测到',
//     //         message: '请求地址：' + details.url + ", 类型：" + details.type,
//     //     });
//     // }
//     console.log('last list:', details);
// }, {urls: ["http://www.uooc.net.cn/home/coupon/list"]}, []);

chrome.webRequest.onBeforeRequest.addListener(details => {
  // cancel 表示取消本次请求
  // if(!showImage && details.type == 'image') return {cancel: true};
  // 简单的音视频检测
  // 大部分网站视频的type并不是media，且视频做了防下载处理，所以这里仅仅是为了演示效果，无实际意义
  // chrome.notifications.create(null, {
  //   type: 'basic',
  //   iconUrl: 'icon/48.png',
  //   title: '检测到音视频',
  //   message: '请求地址：' + details.url + ", 类型：" + details.type,
  // });
  console.log('uooc request:', details);
}, {urls: ["http://www.uooc.net.cn/home/learn/*"]}, []);

chrome.webRequest.onCompleted.addListener(details => {
  console.log('列表加载完毕', new Date());
  // setTimeout(() => {
  //   chrome.extension.sendMessage({uoocEvent: "listLoaded"},
  //     function(response) {
  //       console.log('on response', response);
  //   });
  // }, 1000);
}, {urls: ["http://www.uooc.net.cn/home/course/list*"]}, []);