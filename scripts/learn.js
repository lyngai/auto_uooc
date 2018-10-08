function extractURLInfo() {
  var id = location.hash.match(/(\d+)/g);
  return {
    course_id: id[0],
    chapter_id: id[1],
    catalog_id: id[2],
    resource_id: id[3]
  };
  // http://www.uooc.net.cn/home/learn/getUnitLearn?catalog_id=1549247637&chapter_id=1210357522&cid=54639857&hidemsg_=true&section_id=1549247637&show=
}

function initInject() {
  var info = extractURLInfo();

  var generateHackDom = function(cid) {
    var progress_group = document.createElement('div');
    progress_group.className = 'progress-group';
    progress_group.style.marginTop = '10px';
    progress_group.setAttribute('course-id', cid);
    var progress_bar = document.createElement('div');
    progress_bar.className = 'uooc-progress-bar';
    progress_bar.innerHTML = '<div class="uooc-progress-bar-top-item animate-all"></div>\
                              <div class="uooc-progress-bar-bottom-item"></div>';
    var progress_time = document.createElement('div');
    progress_time.className = 'progress-time';
    progress_time.innerHTML = '<span class="start-date">学习进度：已完成章节/章节数</span>\
                               <span class="end-date">当前状态：等待测试</span>';
    progress_group.appendChild(progress_bar);
    progress_group.appendChild(progress_time);
    var button = document.createElement('a');
    button.className = "course-right-bottom-btn";
    button.classList.add('course-auto-learn');
    button.href = `home/learn/index#/${cid}/go`;
    button.target = '_blank';
    button.innerText = "进入学习";
    button.setAttribute('course-id', cid);
    button.onclick = function(e) {
      console.log('clicked');
    };
    // 配色container
    var orange = document.createElement('div');
    orange.className = "orange";
    orange.classList.add('course-hack-dom');
    orange.appendChild(progress_group);
    orange.appendChild(button);
    // if(!clearfix) {
    //   clearfix = document.createElement('div');
    //   clearfix.style.clear = "both";
    // }
    // orange.appendChild(clearfix.cloneNode());
    return orange;
  };

  var initHackDom = function(cid) {
    var uooc = new UOOC(cid);
    uooc.getCatalogList((finished, total) => {
      var pg = document.querySelector(`.progress-group[course-id="${cid}"]`);
      var top_progress = pg.querySelector('.uooc-progress-bar-top-item');
      var stats = pg.querySelector('.start-date');
      var status = pg.querySelector('.start-date');
      top_progress.style.width = `${(finished / total) * 100}%`;
      stats.innerText = `学习进度：${finished}/${total}`;
    });
  };

  var hackDom = generateHackDom(info.course_id);
  // var container = document.querySelector('.learn-head');
  var appendDom = function(container){
    if(!container) {
      setTimeout(() => {appendDom(document.querySelector('.learn-head'))}, 500);
      return;
    }
    // .appendChild(hackDom);
    container.parentElement.insertBefore(hackDom, container);
    initHackDom(info.course_id);
  };

  appendDom();
  // console.log(hackDom);
}

function UOOC(cid) {
  this.cid = cid;

  this.getCatalogList = function (cb) {
    $.ajax({
      url: '/home/learn/getCatalogList',
      data: {
        cid: this.cid,
        hidemsg_: true,
        show: ''
      },
      success: function(response) {
        var chapterData = response.data;
        var sectionList = chapterData.reduce((sections, chapter) => (sections.concat(chapter.children)), []);
        cb(sectionList.reduce((sum, section) => (sum + section.finished), 0), sectionList.length, sectionList);
      }
    });
  };

  this.getCourseLearn = function(cb) {
    var self = this;
    $.ajax({
      url: '/home/learn/getCourseLearn',
      data: {
        cid: self.cid
      },
      success: function(response) {
        var learnData = response.data;
        self.catalog_id = learnData.catalog_id;
        self.chapter_id = learnData.chapter_id;
        self.resource_id = learnData.resource_id;
        self.section_id = learnData.section_id;
        // 刷课倍速标记
        self.acceleration = learnData.can_acceleration_video === '1';
        cb(self);
      }
    });
  };

  this.getUnitLearn = function(info, cb) {
    var self = this;
    $.ajax({
      url: '/home/learn/getUnitLearn',
      data: {
        cid: info.cid,
        catalog_id: info.catalog_id,
        chapter_id: info.chapter_id,
        section_id: info.section_id,
        hidemsg_: true,
        show: ''
      },
      success: function(response) {
        if(response.code == 600) { // 闯关模式
          cb(null);
          return;
        }
        cb(response.data.map((resource) => {
          var info = {
            resource_id: resource.id,
            type: resource.type,
            video_pos: parseFloat(resource.video_pos),
            subsection_id: resource.task_id
          };
          switch(`${resource.type}`) {
            case '10': // video
              if(resource.video_url) {
                for(var key in resource.video_url) {
                  info.network = parseInt(key.match(/\d+/g)[0] || -1);
                  info.video_url = resource.video_url[key].source;
                  break;
                }
              }
              break;
            case '60': // text
            case '80': // 测试题
            default:
              break;
          }
          return info;
        }));
      }
    });
  };

  this.markVideoLearn = function(info, onProgress, done) {
    var self = this;
    var video_pos = info.video_pos;
    var mark = function(next_pos, cb) {
      $.ajax({
        method: 'post',
        url: '/home/learn/markVideoLearn',
        data: {
          chapter_id: info.chapter_id,
          cid: self.cid,
          hidemsg_: true,
          network: info.network,
          resource_id: info.resource_id,
          section_id: info.section_id,
          source: 1,
          subsection_id: info.subsection_id,
          video_length: info.video_length,
          video_pos: next_pos
        },
        success: function(response) {
          cb(response.code, response.code === 1 ? response.data.finished : null);
        }
      });
    };
    var callback = function(code, finished) {
      if(finished === 1 && video_pos >= info.video_length) {
        done();
        return;
      }
      console.log(`进度：${video_pos} / ${info.video_length}`);
      // 默认下一次延迟10秒
      var delay = 10 * 1000;
      // 计算下一次增量
      if(code === 1) {
        var delta = 10 + Math.random();
        var remain = info.video_length - video_pos;
        // 允许倍速播放时按 1.9 倍播放
        if(self.acceleration) {
          delta *= 1.9;
        }
        // 不允许超过实际，并规格化
        delta = parseFloat((delta < remain ? delta : remain).toFixed(2));
        video_pos += delta;
        // 计算延时
        delay = self.acceleration ? parseFloat(delta / 1.9) : delta;
      } else { // 两秒后重试
        delay = 2;
      }
      setTimeout(
        () => {mark(video_pos, callback)},
        delay * 1000
      );
    };
    if(video_pos < info.video_length) {
      location.hash = `#/${self.cid}/${info.chapter_id}/${info.section_id}/${info.resource_id}/section`;
      mark(video_pos, callback);
    } else {
      done();
    }
  };

  this.getVideoDuration = async function(src) {
    return await new Promise((resolve, reject) => {
      var video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = function(e) {
        resolve(e.target.duration);
      };
      video.onerror = function() {
        resolve(0);
      };
      video.src = src;
    });
  };

  this.startLearnQueue = function(list, onProgress, onAborted) {
    var self = this;
    return list.reduce((lastPromise, section, index) => (lastPromise.then((res) => (
      new Promise((resolve, reject) => {
        var info = {
          chapter_id: section.pid,
          catalog_id: section.id,
          section_id: section.id,
          cid: self.cid
        };
        self.getUnitLearn(info, function(section_info) {
          if(!section_info) {
            reject();
            return;
          }
          for(var i = 0; i < section_info.length; i++) {
            info.network = section_info[i].network;
            info.resource_id = section_info[i].resource_id;
            info.video_pos = section_info[i].video_pos;
            info.subsection_id = section_info[i].subsection_id;
            self.getVideoDuration(section_info[i].video_url).then(duration => {
              info.video_length = parseFloat(duration.toFixed(2));
              info.hidemsg_ = true;
              info.source = 1;
              console.log(section.name + ' start');
              self.markVideoLearn(info, null, () => {
                console.log(section.name + ' done');
                resolve();
              })
            });
            break;
          }
        });
      })
    ))), Promise.resolve()).catch(err => {
      onAborted();
    });
  };

}

initInject(); 
var info = extractURLInfo();
var uooc = new UOOC(info.course_id);
uooc.getCatalogList((finished, total, list) => {
  var toLearnList = list.filter((item) => (item.finished === 0));
  console.log(`学习进度：${finished}/${total}`, toLearnList);
  uooc.startLearnQueue(toLearnList, () => {}, () => {
    uooc.getCourseLearn((object) => {
      location.hash = `#/${object.cid}/${object.chapter_id}/${object.section_id}/${object.resource_id}/section`;
    });
  });
});

//http://www.uooc.net.cn/home/learn/getUnitLearn?
//catalog_id=1536742370&
//chapter_id=1760397466&
//cid=1308638451&
//hidemsg_=true&
//section_id=1536742370&
//show=
//
//http://www.uooc.net.cn/home/learn/getUnitLearn?
//catalog_id=1003478650&
//chapter_id=1210357522&
//cid=54639857&
//hidemsg_=true&
//section_id=1003478650&
//show=
//
//