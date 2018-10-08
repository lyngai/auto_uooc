var clearfix = document.createElement('div');
clearfix.style.clear = "both";

function initInject() {
  var courses = document.querySelectorAll('.course-item.course-learning:not(.ext-tracked)');
  if(courses.length === 0) { return; }

  var generateHackDom = function(cid) {
    var progress_group = document.createElement('div');
    progress_group.className = 'progress-group';
    progress_group.style.marginTop = '30px';
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
    if(!clearfix) {
      clearfix = document.createElement('div');
      clearfix.style.clear = "both";
    }
    orange.appendChild(clearfix.cloneNode());
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

  for(var i = 0; i < courses.length; i++) {
    if(courses[i].classList.contains('ext-tracked')) { continue; }
    var hackDom = generateHackDom(courses[i].id);
    var bot = courses[i].querySelector('.course-info-bot');
    bot.appendChild(clearfix.cloneNode());
    bot.appendChild(hackDom);
    courses[i].classList.add('ext-tracked');
    initHackDom(courses[i].id);
  }
}

setInterval(initInject, 500);

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
        var sectionList = chapterData.reduce((sections, chapter) => {
          return sections.concat(chapter.children);
        }, []);
        cb(sectionList.reduce((sum, section) => (sum + section.finished), 0), sectionList.length);
      }
    })
  };
}