var $body = $("#inner-body"),
    Type,
    PhoneView = false,
    supportHistory = !!(window.history.pushState && window.history.replaceState);

//alert(!!navigator.userAgent.match(/mobile/i));

$(function () {
    //load article list and cnblog list
    if (!$("#left-middle").html().trim()) {
        $.get(window.location.origin, null, function (data) {
            var $data = $(data);

            $("#left-middle").html($data.find("#left-middle").html());
            $("#right-middle").html($data.find("#right-middle").html());
        }, "html");
    }
    init();
    doChanged();
});


$("#aside").on({
    "mouseenter": function () {
        !PhoneView && $(this).removeClass("aside-close").addClass("aside-open");
    },
    "mouseleave": function () {
        !PhoneView && $(this).removeClass("aside-open").addClass("aside-close");
    },
    "click": function(e){
        var $this = $(this);

        if(PhoneView) {
            if (e.target.className == "close") {
                $this.removeClass("aside-open").addClass("aside-close");
            }else if(!$this.hasClass("aside-open")){
                $this.removeClass("aside-close").addClass("aside-open");
            }
        }
    }
});


$("#switch").on("click",function(){
    if(PhoneView){
        $body.toggleClass("right-middle");
    }else{
        $(this).one("mouseleave", function () {
            $body.toggleClass("right-middle");
        });
    }
});

$(window).resize(function () {
    PhoneView = $("body").width() < 900;
    doChanged();
});

$(".content").scroll(function(){
    if(!PhoneView) return;

    if($(this).scrollTop() >= 10){
        $("#aside").addClass("slideUp");
    }else{
        $("#aside").removeClass("slideUp");
    }
    fixWidthOfAside();
});

$(".contents,.profile").on("click", "a", function (e) {
    //for normal a link
    var action = $(this).attr("action");
    if (!action || !supportHistory) {
        return;
    }

    if (PhoneView && this.id == "readmore"){
        $("#aside").removeClass("aside-open").addClass("aside-close");
        e.stopPropagation();
    }

    e.preventDefault();
    var href = this.href;

    maskLoding.show();
    switch (Type = $(this).attr("action")) {
        case "article":
            $("#left-bottom").load(href + " #left-bottom>*", function () {
                $body.removeClass("left-top left-middle").addClass("left-bottom");
                $(this).scrollTop(0);
                doChanged();
                window.history.pushState({type: action, url: href}, document.title, href);
                maskLoding.hide();
                initDuoshuo();
            });
            break;
        case "tag":
            $("#left-top").load(href + " #left-top>*", function () {
                $body.removeClass("left-bottom left-middle").addClass("left-top");
                PhoneView && $(this).scrollTop(0);
                doChanged();
                window.history.pushState({type: action, url: href}, document.title, href);
                maskLoding.hide();
            });
            break;
        case "page":
            $("#left-middle").load(href + " #left-middle>*", function () {
                $body.removeClass("left-top left-bottom");
                $(this).scrollTop(0);
                doChanged();
                window.history.pushState({type: action, url: href}, document.title, href);
                maskLoding.hide();
            });
            break;
        default :
            Type = "list";
            PhoneView && $("#left-middle").scrollTop(0);
    }
});

$("#home-btn").click(function () {
    $body.removeClass("left-bottom left-top right-middle").addClass("left-middle");
    window.history.pushState({type: Type = "list", url: window.location.origin}, document.title, window.location.origin);
    doChanged();
    stopMedia();
});

window.addEventListener("popstate", function (e) {
    switch (Type = e.state.type) {
        case "article":
            $body.removeClass("left-top left-middle").addClass("left-bottom");
            break;
        case "tag":
            $body.removeClass("left-bottom left-middle").addClass("left-top");
            break;
        case "list":
            if (window.location.pathname.search(/^\/$||\/page\//) != 0) {
                $body.removeClass("left-bottom left-top").addClass("left-middle");
                break;
            }
        case "page":
            maskLoding.show();
            $("#left-middle").load(e.state.url + " #left-middle>*", function () {
                $body.removeClass("left-top left-bottom");
                doChanged();
                window.history.pushState({
                    type: "page",
                    url: window.location.href
                }, document.title, window.location.href);
                maskLoding.hide();
            });
    }
    doChanged();
    stopMedia();
});


var masker = (function () {
    var $mask = $("#mask-layer");

    return {
        show: function () {
            $mask.fadeIn();
        },
        hide: function () {
            $mask.fadeOut();
        }
    }
})();

var maskLoding = (function () {
    var $loading = $("#loading");

    return {
        show: function () {
            $loading.fadeIn();
            masker.show();
        },
        hide: function () {
            $loading.fadeOut();
            masker.hide();
        }
    }
})();

function init() {
    PhoneView = $("body").width() < 900;

    var path = window.location.pathname;

    if (path == "/") {
        Type = "list";
    } else if (path.indexOf("/tag/") == 0) {
        Type = "tag";
    } else if (path.indexOf("/page/") == 0) {
        Type = "page";
    } else {
        Type = "article";
        initDuoshuo();
    }
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

var fixWidthOfAside = (function() {
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

    return function() {
        //do the change when convert layout
        if(isPhoneViewBefore && !PhoneView){
            //phone to pc
            $body.css("padding-top", "");
            isPhoneViewBefore = PhoneView;
        }else if(!isPhoneViewBefore && PhoneView){
            //pc to phone
            $body.css("padding-left", "");
            $title.width("auto");
            isPhoneViewBefore = PhoneView;
        }

        if (PhoneView) {
            if(Type == "article") {return $body.css("padding-top",0)};
            $body.css("padding-top", $aside.hasClass("slideUp") ? 0 : $title.height());
        }else{
            if ($body.hasClass("left-bottom")) {
                $body.css("padding-left",0);
            } else {
                width = $title.height() * 0.3;
                $title.width(width);
                $body.css("padding-left",width);
            }
        }
    }
})();


//duoshuo
function initDuoshuo() {
    var ds = document.getElementById("ds-thread");
    DUOSHUO.EmbedThread(ds);
}