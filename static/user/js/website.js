/**
 * Created by pc on 9/24/16.
 */
function delHtmlTagAndCut(str) {
    var strTrim = str.replace(/<[^>]+>/g, "");//去掉所有的html标记
    if (strTrim.length > 10) {
        strTrim = strTrim.substring(0, 150);
    }
    return strTrim
}
function toggleDuoshuoComments(container, id, website) {
    var el = document.createElement('div');//该div不需要设置class="ds-thread"
    el.setAttribute('data-thread-key', id);//必选参数
    el.setAttribute('data-url', website);//必选参数
    el.setAttribute('data-author-key', 'pc');//可选参数
    DUOSHUO.EmbedThread(el);
    jQuery(container).append(el);
}

function setHeaderPicture(url) {
    $('header').css('background-image', "url(" + url + ")");
    NProgress.inc(0.2);
}


function setIndexHeader() {
    $('header').empty();
    $('header').append(`
    <div class="container" style="background-color: rgba(0,0,0,0.8);height:60px;width:100%;">
        <div class="row">
        </div>
    </div>
    `)
}
function setIndexContent() {
    $.ajax({
        type: 'GET',
        url: '/api/indexContent',
        success: function (result) {
            $('#main-content').html(result);
            $('.post-preview a.toPostDetail').click(function () {
                stateObject = {
                    id: $(this).attr('id'),
                };
                title = 'test';
                date = new Date($(this).attr('time'));
                url = "/beta/posts/" + date.getFullYear() + "/" + date.getMonth() + "/" + date.getDate() + "/" + $(this).attr('id');
                window.history.pushState(stateObject, title, '/beta' + $(this).attr('url'));
                flag = 1;
            });
            $('img.about').click(function () {
                title = 'about';
                window.history.pushState(null, title, "/beta/about");
                flag = 1;
            });
            $('a.toPosts').click(function () {
                title = 'posts';
                window.history.pushState(null, title, "/beta/posts");
                flag = 1;
            });
            count = 0;
            $('img').load(function () {
                count++;
                NProgress.inc(0.05);
                if (count == $('img').length) {
                    NProgress.done();
                }
            });
            NProgress.inc(0.2);
        }
    })
}


function setPostDetailHeader(title, author, time) {
    date = new Date(time);
    timeFull = date.getFullYear() + "年 " + (date.getMonth() + 1) + "月 " + date.getDate() + "日";
    $('header').empty();
    $('header').append(`<div class='mask'></div>`)
    $('header').append(`
        <div class="container">
            <div class="row">
                    <div class="col-lg-8 col-md-10">
                    <div class="post-heading">
                        <h1>` + title + `</h1>
                        <br>
                        <span class="meta"> <i class="fa fa-user fa-fw"></i><a> ` + author + `</a>
                            <i class="fa fa-calendar fa-fw"></i><a> ` + timeFull + `</a></span>
                    </div>
                </div>
            </div>
        </div>
    `);
}
function setPostDetailContent() {
    count = 0;
    $('#main-content').empty();
    var id = window.location.pathname.split('/')[6];
    $.ajax({
        type: 'GET',
        url: '/api/post/' + id,
        success: function (post) {
            setHeaderPicture(post.imgurl);
            var tags = '';
            post.tags.forEach(function (x) {
                tags += ' ' + x.name;
            });
            $('#main-content').html(`
        <p id="tag-content" style="margin: 10px 0 5px 3px">标签: ` + tags + `</p>
        <div class="col-xs-12 col-sm-9 col-md-9" id="post-content">
            <div class="post">` + post.content + `</div>
            <br>
            <!-- 多说评论框 start -->
            <div id="comment-box"></div>
            <!-- 多说评论框 end -->
        </div>
        <div class="col-xs-12 col-sm-3 col-md-3">
            <div class="post-right">
            </div>
        </div>
            `);
            $.ajax({
                type: 'GET',
                url: '/api/postSidebar/' + post.id,
                success: function (result) {
                    $('.post-right').html(result);
                    $('.recent-posts a').click(function () {
                        title = 'post';
                        window.history.pushState(null, title, $(this).attr('url'));
                        flag = 1;
                    })
                    $('.relative-posts a').click(function () {
                        title = 'post';
                        window.history.pushState(null, title, $(this).attr('url'));
                        flag = 1;
                    })
                    $('.all-tags a').click(function () {
                        title = 'post';
                        window.history.pushState(null, title, $(this).attr('url'));
                        flag = 1;
                    })
                }
            });
            $('<img/>').attr('src', post.imgurl).load(function () {
                count++;
                NProgress.inc();
                if (count == $('.post img').length + 1) {
                    NProgress.done();
                }
            });
            $('.post img').one('load', function () {
                count++;
                NProgress.inc();
                if (count == $('.post img').length + 1) {
                    NProgress.done();
                }
            });
            toggleDuoshuoComments('#comment-box', post.id, 'chengpeng.org');
            NProgress.inc();
            $('img').addClass('img-responsive');
            $('title').html('Pitcher | ' + post.title);
            setPostDetailHeader(post.title, post.author, post.time);
        }
    });
}

function setAboutHeader() {
    $('header').empty();
    $('header').append(`
        <div class="container" style="background-color: rgba(0,0,0,0.8);height:60px;width:100%;>
        <div class="row">
        </div>
    </div>
    `)
}
function setAboutContent() {
    $.ajax({
        type: 'GET',
        url: '/api/aboutContent',
        success: function (result) {
            $('#main-content').html(result);
            toggleDuoshuoComments('#comment-box', 'about', 'chengpeng.org');
            count = 0;
            $('.content img').load(function () {
                count++;
                NProgress.inc(0.05);
                if (count == $('.content img').length) {
                    NProgress.done();
                }
            });
        }
    })
}

function setPostsHeader() {
    $.ajax({
        type: 'GET',
        url: '/api/postsHeader',
        success: function (result) {
            $('header').html(result);
            if (document.readyState == "complete") {
                NProgress.done()
            }
        }
    })
}
function setPostsContent() {
    var tag = location.search.split('tag=')[1]
    if (!tag) {
        $.ajax({
            type: 'GET',
            url: '/api/postsContent',
            success: function (result) {
                $('#main-content').html(result);
                $('.toPostDetail').click(function () {
                    title = 'post-detail';
                    window.history.pushState(null, title, "/beta" + $(this).attr('url'));
                    flag = 1;
                });
                NProgress.done()
            }
        })
    } else {
        $.ajax({
            type: 'GET',
            url: '/api/postsContent?tag=' + tag,
            success: function (result) {
                $('#main-content').html(result);
                $('.toPostDetail').click(function () {
                    title = 'post-detail';
                    window.history.pushState(null, title, "/beta" + $(this).attr('url'));
                    flag = 1;
                });
                NProgress.done()
            }
        })
    }
}

function setProjectHeader() {
    $.ajax({
        type: 'GET',
        url: '/api/projectHeader',
        success: function (result) {
            $('header').html(result);
        }
    })
}
function setProjectContent() {
    $.ajax({
        type: 'GET',
        url: '/api/projectContent',
        success: function (result) {
            $('#main-content').html(result);
            $(".portfolio-hover").click(function () {
                $("iframe#skilltree").attr("src", "/project/skill-tree/showcase");
                $("button.skilltree").html("<i class='fa fa-refresh fa-spin fa-3x fa-fw'></i> <span class='sr-only'>载入中...</span>");
                $("iframe#skilltree").load(function () {
                    $("button.skilltree").html("<i class='fa fa-times'>离开");
                })
            });
            $('button.skilltree').click(function () {
                $("iframe#skilltree").attr("src", "");
            });
            $('.close-modal.skilltree').click(function () {
                $("iframe#skilltree").attr("src", "");
            });
            /*            count = 0;
             $('.portfolio-link img').load(function () {
             count++;
             console.log(count);
             if (count == $('.portfolio-link img').length) {
             NProgress.done();
             }
             });*/
            NProgress.done();
        }
    })
}

function router(components) {
    components.forEach(function (component) {
        if (component.url.test(window.location.pathname)) {
            component.content();
        }
    });
}

function easyRouter(components) {
    flag = 1;
    setInterval(function () {
        if (flag) {
            router(components);
            flag = 0;
        }
    }, 100);
    window.onpopstate = function (event) {
        router(components)
    };

}


components = [
    {
        url: /\/beta\/$/,
        content: index
    },
    {
        url: /\/beta\/posts\/\w+/,
        content: postDetail
    },
    {
        url: /\/beta\/about$/,
        content: about
    },
    {
        url: /\/beta\/posts$/,
        content: posts
    },
    {
        url: /\/beta\/project$/,
        content: project
    },
];

$('a.router-about').click(function () {
    title = 'about';
    window.history.pushState(null, title, "/beta/about");
    flag = 1;
});

$('a.router-index').click(function () {
    title = 'index';
    window.history.pushState(null, title, "/beta/");
    flag = 1;
});

$('a.router-posts').click(function () {
    title = 'posts';
    window.history.pushState(null, title, "/beta/posts");
    flag = 1;
});

$('a.router-project').click(function () {
    title = 'project';
    window.history.pushState(null, title, "/beta/project");
    flag = 1;
});

if (window.location.pathname == '/') {
    window.history.pushState(null, 'index', "/beta/");
    flag = 1;
}
var count = 0;

function index() {
    NProgress.start();
    $('title').html('Pitcher | 主页');
    $('nav li a').css('font-size', '1em');
    $('.router-index').css('font-size', '1.5em');
    setIndexHeader();
    setHeaderPicture('');
    setIndexContent();
}

function postDetail() {
    NProgress.start();
//    $('#mask').attr('style', 'width:100%;height:100%;z-index:10;background-color:rgba(0, 0, 0, 0.5);position:fixed;');
    $('nav li a').css('font-size', '1em');
    $('.router-posts').css('font-size', '1.5em');
    setPostDetailContent();
}

function about() {
    NProgress.start();
    $('title').html('Pitcher | 关于');
    $('nav li a').css('font-size', '1em');
    $('.router-about').css('font-size', '1.5em');
    setAboutHeader('关于我', '我劝天公重抖擞,不拘一格降人才');
    setHeaderPicture('');
    setAboutContent();
}

function posts() {
    NProgress.start();
    $('title').html('Pitcher | 文章');
    $('nav li a').css('font-size', '1em');
    $('.router-posts').css('font-size', '1.5em');
    setPostsHeader();
    setHeaderPicture('');
    setPostsContent();
}

function project() {
    NProgress.start();
    $('title').html('Pitcher | 作品');
    $('nav li a').css('font-size', '1em');
    $('.router-project').css('font-size', '1.5em');
    setProjectHeader();
    setProjectContent();
}


easyRouter(components);
