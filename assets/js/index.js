var $body = $("#inner-body");

$(function () {
    if (!$("#left-middle").html().trim()) {
        $.get(window.location.origin, null, function (data) {
            var $data = $(data);

            $("#left-middle").html($data.find("#left-middle").html());
            $("#right-middle").html($data.find("#right-middle").html());
        }, "html");
    }
    doChanged();
});

$("#aside").on({
    "mouseenter": function () {
        $(this).removeClass("aside-close").addClass("aside-open");
    },
    "mouseleave": function () {
        $(this).removeClass("aside-open").addClass("aside-close");
    }
});

$("#switch").on("click", function () {
    $(this).one("mouseleave", function () {
        $body.toggleClass("right-middle");
    });
});

$(window).resize(function () {
    doChanged();
});

$(".contents").on("click", "a", function (e) {
    //for right-middle
    var action = $(this).attr("action");

    if (!action) {
        return;
    }

    e.preventDefault();
    var href = this.href;

    maskLoding.show();
    switch ($(this).attr("action")) {
        case "article":
            $("#left-bottom").load(href + " #left-bottom>*", function () {
                $body.removeClass("left-top left-middle").addClass("left-bottom");
                $(this).scrollTop(0);
                doChanged();
                window.history.pushState({type: action, url: href}, document.title, href);
                maskLoding.hide();
            });
            break;
        case "tag":
            $("#left-top").load(href + " #left-top>*", function () {
                $body.removeClass("left-bottom left-middle").addClass("left-top");
                doChanged();
                window.history.pushState({type: action, url: href}, document.title, href);
                maskLoding.hide();
            });
            break;
        case "page":
            $("#left-middle").load(href + " #left-middle>*", function () {
                $body.removeClass("left-top left-bottom");
                doChanged();
                window.history.pushState({type: action, url: href}, document.title, href);
                maskLoding.hide();
            });
            break;
    }
});

$("#home-btn").click(function () {
    $body.removeClass("left-bottom left-top right-middle").addClass("left-middle");
    window.history.pushState({type: "list", url: window.location.origin}, document.title, window.location.origin);
    doChanged();
    stopMedia();
});

window.addEventListener("popstate", function (e) {
    switch (e.state.type) {
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

function initState() {
    var path = window.location.pathname,
        type;
    if (path == "/") {
        type = "list";
    } else if (path.indexOf("/tag/") == 0) {
        type = "tag";
    } else if (path.indexOf("/page/") == 0) {
        type = "page";
    } else {
        type = "article"
    }
    window.history.replaceState({type: type, url: window.location.href}, document.title, window.location.href);
}
initState();

function doChanged() {
    fixWidthOfAside();
}

function stopMedia() {
    $("#left-bottom").find("audio,video").each(function () {
        this.pause();
    })
}

function fixWidthOfAside() {
    /**
     * 修正浏览器bug,test.html中测试
     * 如果子节点为img，其宽度auto，高度根据父节点高度百分比变化
     * 父节点宽度为auto，在resize之后，父节点不会发生宽度变化，在所有浏览器中表现都不一样
     * 只能用js去纠正
     */
    if ($body.hasClass("left-bottom")) {
        $("#container").css("margin-left", 0);
    } else {
        var title = $("#aside .title"),
            width = title.height() * 0.3;
        title.css("width", width);
        $("#container").css("margin-left", width);
    }
}