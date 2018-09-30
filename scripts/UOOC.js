window.UOOC = function (cid) {
  this.cid = cid;
  this.getCatalogList = function () {
    $.ajax({
      url: '/home/learn/getCatalogList',
      data: {
        cid: this.cid,
        hidemsg_: true,
        show: ''
      },
      cache: false,
      success: function(response) {
        console.log(response);
      }
    })
  }
}
