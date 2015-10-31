var $body = $("#inner-body"),
    Type,
    PhoneView = false,
    currentPathname = "/",
    Title = "纸异兽",
    supportHistory = !!(window.history.pushState && window.history.replaceState);

//alert(!!navigator.userAgent.match(/mobile/i));

$(function () {
    //load article list and cnblog list
    if (!$("#left-middle").html().trim()) {
        $.get("/", null, function (data) {
            var $data = $(data);

            $("#left-middle").replaceWith($data.find("#left-middle"));
            $("#right-middle").replaceWith($data.find("#right-middle"));
        }, "html");
    }
    init();
});


$("#aside").on({
    "mouseenter": function () {
        !PhoneView && $(this).removeClass("aside-close").addClass("aside-open");
        $("#aside .profile").scrollTop(0);
    },
    "mouseleave": function (e) {
        if(!(e.relatedTarget && e.relatedTarget.id == "switch")){
            !PhoneView && $(this).removeClass("aside-open").addClass("aside-close");
        }
    },
    "click": function (e) {
        var $this = $(this);

        if (PhoneView) {
            if (e.target.className == "close") {//click close button
                $this.removeClass("aside-open").addClass("aside-close");
            } else if (!$this.hasClass("aside-open")) {
                $this.removeClass("aside-close").addClass("aside-open");
                $("#aside .profile").scrollTop(0);
            }
        }
    }
});

$("#switch").on({
    "mouseenter": function () {
        if(!PhoneView) {
            $(this).addClass("hover");
            clearTimeout($(this).data("timeout"));
        }
    },
    "mouseleave": function (e) {
        if(!PhoneView) {
            $(this).removeClass("hover");

            if (!(e.relatedTarget && $(e.relatedTarget).parents().filter("#aside").length != 0)) {
                $(this).data("timeout",setTimeout(function () {
                    $("#aside").removeClass("aside-open").addClass("aside-close");
                }, 300));
            }
        }
    },
    "click": function () {
        var $this = $(this);
        if (PhoneView) {
            $body.toggleClass("right-middle");
            $("html,body").scrollTop(0);
        } else {
            //toggle hover class, if hover exists, so that this is first click after mouseenter
            //if hover not exist, so prove that this isn't.
            $this.toggleClass("hover");

            //if isn't first click, add animation to this event
            if ($this.hasClass("hover")) {
                setTimeout(function () {
                    $body.toggleClass("right-middle");
                    $this.removeClass("hover");
                }, 500);
            } else {
                $body.toggleClass("right-middle");
            }
        }
    }
});

$(window).resize(function () {
    PhoneView = $("body").width() < 900;
    doChanged();
});

$(".content").scroll(function () {
    if (!PhoneView) return;

    if ($(this).scrollTop() >= 10) {
        $("#aside").addClass("slideUp");
    } else {
        $("#aside").removeClass("slideUp");
    }
    fixWidthOfAside();
});

function ATagClick(e, data) {
    //for normal a link
    var isPopstate = !e,
        action = isPopstate ? data.action : $(this).attr("action"),
        title = Title;

    if (!action || !supportHistory) {
        return;
    }

    if (!data && PhoneView && this.id == "readmore") {
        $("#aside").removeClass("aside-open").addClass("aside-close");
        e.stopPropagation();
    }

    e && e.preventDefault();
    var href = isPopstate ? data.href : this.href;
    currentPathname = href.replace(/^.*?\/\/.*?(?=\/)/,"");

    maskLoding.show();
    switch (Type = action) {
        case "article":
            $("#left-bottom").load(href + " #left-bottom>*", function () {
                $body.removeClass("left-top left-middle").addClass("left-bottom");

                if (PhoneView) {
                    $("html,body").scrollTop(0);
                    playMedia();
                } else {
                    $(this).scrollTop(0);
                }

                doChanged();
                setTitle(title = $("h1.post-title").text());
                !isPopstate && window.history.pushState({type: action, url: href}, title, href);
                maskLoding.hide();
                initDuoshuo();
            });
            break;
        case "tag":
            $("#left-top").load(href + " #left-top>*", function () {
                $body.removeClass("left-bottom left-middle").addClass("left-top");
                PhoneView ? $("html,body").scrollTop(0) : $(this).scrollTop(0);
                doChanged();
                setTitle(title = $("h1.page-title").text());
                !isPopstate && window.history.pushState({type: action, url: href}, title, href);
                maskLoding.hide();
            });
            break;
        case "page":
            $("#left-middle").load(href + " #left-middle>*", function () {
                $body.removeClass("left-top left-bottom");
                PhoneView ? $("html,body").scrollTop(0) : $(this).scrollTop(0);
                doChanged();
                setTitle(title);
                !isPopstate && window.history.pushState({type: action, url: href}, document.title, href);
                maskLoding.hide();
            });
            break;
    }
}

$(".contents,.profile").on("click", "a", ATagClick);


//zoom for picture
(function () {
    var $tag = $("<a class='show-original-img white'>原图</a>"),
        img = document.createElement("img"),
        $img = $(img),
        $oriBox = $("<div id='original-box'><div id='masker-close'>&times;</div></div>"),
        $close = $oriBox.children("#masker-close"),
    //store original image data for zoom smaller to recovery the location
        originalData = {
            ratio: 1,
            width: 0,
            height: 0,
            top: 0,
            left: 0,
            //for limit mousemove event
            isLock: true
        },
        url;

    $(".contents")
        .on("mouseenter", ".post-content img", function () {
            var $this = $(this);

            url = this.src.replace(/-resize$/, "");
            $this.parent().css("position", "relative");
            originalData.ratio = $this.width() / $this.height();

            $tag.css({
                "top": $this.position().top,
                "right": $this.parent().width() - $this.width() - $this.position().left
            });

            $this.after($tag);
        }).on("mouseleave", ".post-content img", function (e) {
            if (e.relatedTarget == $tag[0]) {
                return;
            }
            $tag.remove();
        });

    $tag[0].onclick = function () {
        var $body = $("body"),
            width,
            height;

        //do it before get width because the scroll bar
        if (PhoneView) {
            $body.css("overflow", "hidden");
        }

        width = $body.width();
        height = $body.height();
        maskLoding.show();
        $oriBox.prepend($img);
        img.src = url;

        if (originalData.ratio > width / height) {
            originalData.width = width;
            originalData.height = width / originalData.ratio;
            originalData.top = (height - originalData.height) / 2;
            originalData.left = 0;
        } else {
            originalData.width = height * originalData.ratio;
            originalData.height = height;
            originalData.top = 0;
            originalData.left = (width - originalData.width) / 2;
        }

        $img.css({
            height: originalData.height,
            width: originalData.width,
            top: originalData.top,
            left: originalData.left
        });

        //for sync showing image and masker
        //so we will get a better transition
        setTimeout(function () {
            $body.append($oriBox);
        }, 300);
    };


    //see "jquery remove() and Event" with bug tag in evernote
    img.onload = function () {
        $("#loading").fadeOut();
    };

    $close[0].onclick = function () {
        if (PhoneView) {
            $("body").css("overflow", "");
        }

        $oriBox.remove();
        maskLoding.hide();
    };

    img.onmousewheel = img.dommousescroll = debounce(mousewheel, 20);
    img.addEventListener("DOMMouseScroll", img.onmousewheel);

    function mousewheel(e) {
        var temp;
        if (!$img[0].complete) return;
        if (e.detail ? e.detail < 0 : e.wheelDelta > 0) {
            $img.css({
                "width": function (index, value) {
                    return parseInt(value) * 1.1;
                }, "height": function (index, value) {
                    return parseInt(value) * 1.1;
                }, "left": function (index, value) {
                    return parseInt(value) - (e.offsetX || e.layerX) * 0.1;
                }, "top": function (index, value) {
                    return parseInt(value) - (e.offsetY || e.layerY) * 0.1;
                }
            });
        } else {
            $img.css({
                "width": function (index, value) {
                    value = parseInt(value);
                    temp = value / 1.1;
                    return value > originalData.width && temp > originalData.width ? temp : (temp = false, originalData.width);
                }, "height": function (index, value) {
                    value = parseInt(value);
                    temp = value / 1.1;
                    return value > originalData.height && temp > originalData.height ? temp : (temp = false, originalData.height);
                }, "left": function (index, value) {
                    return temp === false ? ($oriBox.width() - originalData.width) / 2 : parseInt(value) + (e.offsetX || e.layerX) / 11;
                }, "top": function (index, value) {
                    return temp === false ? ($oriBox.height() - originalData.height) / 2 : parseInt(value) + (e.offsetY || e.layerY) / 11;
                }
            })
        }
    }

    //open the limit of draging
    img.ondragstart = function (e) {
        e.returnValue = false;
        return false;
    };
    img.onmousedown = function (e) {
        if (!img.complete) return;
        originalData.isLock = false;
        originalData.left = e.clientX;
        originalData.top = e.clientY;
    };
    img.onmousemove = debounce(function (e) {
        e.preventDefault();
        if (!img.complete || originalData.isLock) return;
        $img.css({
            left: parseInt($img.css("left")) + e.clientX - originalData.left,
            top: parseInt($img.css("top")) + e.clientY - originalData.top
        });
        originalData.left = e.clientX;
        originalData.top = e.clientY;
    }, 20);
    img.onmouseup = function () {
        originalData.isLock = true;
    };
    img.onmouseout = function (e) {
        originalData.isLock = true;
    }
})();

$("#home-btn").click(function () {
    $body.removeClass("left-bottom left-top right-middle").addClass("left-middle");
    currentPathname = "/";

    setTitle(Title);
    window.history.pushState({type: Type = "page", url: "/"}, Title, "/");
    doChanged();
    stopMedia();
});

$(window).on("popstate", function (e) {
    var state = e.originalEvent.state;

    switch (Type = state.type) {
        case "article":
            ATagClick(undefined, {action: Type, href: state.url});
            break;
        case "tag":
            $body.removeClass("left-bottom left-middle").addClass("left-top");
            break;
        case "page":
            if (currentPathname.search(/^\/$|\/page\//) != 0) {
                $body.removeClass("left-bottom left-top").addClass("left-middle");
                break;
            }
            ATagClick(undefined, {action: Type, href: state.url});
    }
    doChanged();
    stopMedia();
});


function setTitle(t) {
    $("title").text(t)
}

var masker = (function (noTransition) {
    var $mask = $("#mask-layer");

    return {
        show: function () {
            if (noTransition) {
                $mask.show();
            } else {
                $mask.fadeIn();
            }
        },
        hide: function () {
            if (noTransition) {
                $mask.hide();
            } else {
                $mask.fadeOut();
            }
        }
    }
})();

var maskLoding = (function (noTransition) {
    var $loading = $("#loading");

    return {
        show: function () {
            $loading.fadeIn();
            masker.show(noTransition);
        },
        hide: function () {
            $loading.fadeOut();
            masker.hide(noTransition);
        }
    }
})();

function init() {
    PhoneView = $("body").width() < 900;

    var path = window.location.pathname;

    if (path == "/") {
        Type = "page";
    } else if (path.indexOf("/tag/") == 0) {
        Type = "tag";
    } else if (path.indexOf("/page/") == 0) {
        Type = "page";
    } else {
        Type = "article";
        playMedia();
        initDuoshuo();
    }

    currentPathname = window.location.pathname;
    //remove aside-init when the DOM is ready, so we can show a perfect page even the index.js is not loaded
    $("#aside").removeClass("aside-init");
    doChanged();
    window.history.replaceState({type: Type, url: window.location.href}, document.title, window.location.href);
}

function doChanged() {
    fixWidthOfAside();
}

function stopMedia() {
    $("#left-bottom").find("audio,video").each(function () {
        this.pause();
    })
}

function playMedia() {
    $("#left-bottom").find("audio[autoplay=autoplay]").each(function () {
        setTimeout(function () {
            this.play();
        }, 1000)
    })
}

var fixWidthOfAside = (function () {
    /**
     * 修正浏览器bug,test.html中测试
     * 如果子节点为img，其宽度auto，高度根据父节点高度百分比变化
     * 父节点宽度为auto，在resize之后，父节点不会发生宽度变化，在所有浏览器中表现都不一样
     * 只能用js去纠正
     */
    var isPhoneViewBefore = $("body").width() < 900,
        $aside = $("#aside"),
        $title = $aside.find(".title"),
        $container = $("#container"),
        width;

    return function () {
        //do the change when convert layout
        if (isPhoneViewBefore && !PhoneView) {
            //phone to pc
            $body.css("padding-top", "");
            isPhoneViewBefore = PhoneView;
        } else if (!isPhoneViewBefore && PhoneView) {
            //pc to phone
            $body.css("padding-left", "");
            $title.width("auto");
            isPhoneViewBefore = PhoneView;
        }

        if (PhoneView) {
            if (Type == "article") {
                return $body.css("padding-top", 0)
            }
            ;
            $body.css("padding-top", $aside.hasClass("slideUp") ? 0 : $title.height());
        } else {
            if ($body.hasClass("left-bottom")) {
                $body.css("padding-left", 0);
            } else {
                width = $body.height() * 0.3;
                $title.width(width);
                $body.css("padding-left", width);
            }
        }
    }
})();


function debounce(func, delay) {
    var lasttime = new Date();

    return function () {
        var now = new Date();
        if (now - lasttime > delay) {
            lasttime = now;
            func.apply(this, arguments);
        }

    }
}

//duoshuo
function initDuoshuo() {
    var ds = document.getElementById("ds-thread");
    DUOSHUO.EmbedThread(ds);
}