var createNodeViewFromP4DJson;
var VisModelJS;
var PolymerGestures;
var pegEditor;
var inputEditor;
var nezEditor;
var bxnezEditor;
var navbarId = ["navbar-overview", "navbar-documents", "navbar-playground"];
var contentId = ["overview", "documents", "playground"];
var editorId = ["peg4d", "input", "nez", "bxnez", "output"];
var inputFocus = "both";
var setEditorId = [];
var reader = new FileReader();
$(function () {
    pegEditor = ace.edit("pegEditor");
    pegEditor.setTheme("ace/theme/xcode");
    pegEditor.getSession().setMode("ace/mode/c_cpp");
    pegEditor.setFontSize(12);
    inputEditor = ace.edit("inputEditor");
    inputEditor.setTheme("ace/theme/xcode");
    inputEditor.getSession().setMode("ace/mode/markdown");
    inputEditor.setFontSize(12);
    nezEditor = ace.edit("nezEditor");
    nezEditor.setTheme("ace/theme/xcode");
    nezEditor.getSession().setMode("ace/mode/c_cpp");
    nezEditor.setFontSize(12);
    bxnezEditor = ace.edit("bxnezEditor");
    bxnezEditor.setTheme("ace/theme/xcode");
    bxnezEditor.getSession().setMode("ace/mode/markdown");
    bxnezEditor.setFontSize(12);
    var root = document.getElementById("visualOutput");
    var panel = new VisModelJS.VisualModelPanel(root);
    var TopNode = createNodeViewFromP4DJson({ "": "" });
    $(window).resize(function () {
        var width = $(window).width();
        var sidebarW = $('.sidebar-right').width();
        $('.sidebar-right').css("left", width - sidebarW + "px");
        resizeTextarea();
    });
    $(".navbar-item").click(function () {
        var id = $(this).attr("id");
        var num;
        var hiddenLeft = "-" + ($(window).width() + 1200) + "px";
        for (var i = 0; i < navbarId.length; i++) {
            if (id == navbarId[i]) {
                $("#" + contentId[i]).css({ left: "0", opacity: 1 });
                $("#" + navbarId[i] + " > span").attr("class", "navbar-content-active");
                num = i;
            }
            else {
                $("#" + contentId[i]).css({ left: hiddenLeft, opacity: 0 });
                $("#" + navbarId[i] + " > span").attr("class", "navbar-content");
            }
        }
        if (num == 2) {
            $(".container").css({ top: "-91px", height: "100%" });
        }
        else {
            $(".container").css({ top: "0", height: "100%" });
        }
    });
    $("#generate").click(generateBxnez);
    $("#format").click(runCallback);
    $(".visualize-btn").click(visualizeCallback);
    $("span[id='peg4d'] > .dropdown > ul > li > a").click(function () {
        console.log(this);
        setP4d($(this).attr("value"), $(this).text());
    });
    $("span[id='nez'] > .dropdown > ul > li > a").click(function () {
        console.log(this);
        setNez($(this).attr("value"), $(this).text());
    });
    $(".konoha-btn").click(function () {
        $("html,body").animate({ scrollLeft: window.innerWidth }, 500);
    });
    $(".nez-btn").click(function () {
        $("html,body").animate({ scrollLeft: 0 }, 500);
    });
    $(".btn-refresh").click(function () {
        var id = $(this).attr("id");
        console.log(id);
        if (id == "input") {
            inputEditor.setValue("");
        }
        else if (id == "p4d") {
            pegEditor.setValue("");
            $("span[id='peg4d'] > .dropdown > button").text("None    ");
            $("span[id='peg4d'] > .dropdown > button").append("<span class=caret>");
        }
        else if (id == "nez") {
            nezEditor.setValue("");
            $("span[id='nez'] > .dropdown > button").text("None    ");
            $("span[id='nez'] > .dropdown > button").append("<span class=caret>");
        }
        else if (id == "bxnez") {
            bxnezEditor.setValue("");
        }
    });
    setSource();
    pegEditor.on("change", changeEditor);
    inputEditor.on("change", changeEditor);
});
$(window).on('touchmove.noScroll', function (e) {
    e.preventDefault();
});
$(window).load(function () {
    resizeTextarea();
});
var timer;
function changeEditor(e) {
    clearTimeout(timer);
    timer = setTimeout(visualizeCallback, 500);
}
function changeMode(mode) {
    var modePath = "";
    if (mode) {
        switch (mode) {
            case "vim":
                modePath = "ace/keyboard/vim";
                break;
        }
    }
    pegEditor.setKeyboardHandler(modePath);
    inputEditor.setKeyboardHandler(modePath);
}
function runNez(source, p4d, callback, onerror) {
    $.ajax({
        type: "POST",
        url: Config.basePath + "/run",
        data: JSON.stringify({ source: source, p4d: p4d }),
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        success: callback,
        error: onerror
    });
}
function generateBxnez(e) {
    var nez = nezEditor.getValue();
    runGenerate(nez, function (res) {
        bxnezEditor.setValue(res.source);
    }, function () {
        console.log("sorry");
    });
}
function runGenerate(nez, callback, onerror) {
    $.ajax({
        type: "POST",
        url: Config.basePath + "/generate",
        data: JSON.stringify({ nez: nez }),
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        success: callback,
        error: onerror
    });
}
function runFormat(source, p4d, bxnez, callback, onerror) {
    $.ajax({
        type: "POST",
        url: Config.basePath + "/format",
        data: JSON.stringify({ source: source, p4d: p4d, bxnez: bxnez }),
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        success: callback,
        error: onerror
    });
}
function runCallback(e) {
    var p4d = pegEditor.getValue();
    var src = inputEditor.getValue();
    var bxnez = bxnezEditor.getValue();
    runFormat(src, p4d, bxnez, function (res) {
        $(".konoha-result[id='konoha']").val(res.source);
    }, function () {
        console.log("sorry");
    });
}
function visualize(source, p4d, callback, onerror) {
    $("#visualOutput").css("display", "");
    $("#visualOutput").css("box-shadow", "");
    $("#visualOutput").empty();
    $("#visualOutput").append("<div style='text-align:center;margin-top:2em;font-size:4em'> <i class='fa fa-spinner fa-spin'> </div>");
    $.ajax({
        type: "POST",
        url: Config.basePath + "./visualize",
        data: JSON.stringify({ source: source, p4d: p4d }),
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        success: callback,
        error: onerror
    });
}
function visualizeCallback(e) {
    var p4d = pegEditor.getValue();
    var src = inputEditor.getValue();
    visualize(src, p4d, function (res) {
        console.log(res);
        $("#visualOutput").empty();
        if (res.runnable) {
            var UA = VisModelJS.Utils.UserAgant;
            var root = document.getElementById("visualOutput");
            var panel = new VisModelJS.VisualModelPanel(root);
            var TopNode = createNodeViewFromP4DJson(JSON.parse(res.source));
            panel.InitializeView(TopNode);
            panel.Draw();
            panel.Viewport.camera.setPositionAndScale(TopNode.centerGx, TopNode.centerGy + panel.Viewport.areaHeight / 3, 1);
            panel.addEventListener("dblclick", function (event) {
                var node = (event).node;
                node.folded = !node.folded;
                if (UA.isTrident()) {
                    for (var k in panel.ViewMap) {
                        panel.ViewMap[k].shape.Content = null;
                    }
                    panel.Draw(panel.TopNodeView.label, 0, node);
                }
                else {
                    panel.Draw(panel.TopNodeView.label, 300, node);
                }
            });
        }
        else {
            document.getElementById("visualOutput").innerText = res.source;
            $("#visualOutput").css("box-shadow", "inset 0 1px 1px rgba(0,0,0,.075),0 0 6px #ce8483");
        }
    }, function () {
        console.log("sorry");
    });
}
function resizeTextarea(toSize) {
    if (toSize) {
        for (var i = 0; i < editorId.length; i++) {
            var target = ".collapse-block[id='" + editorId[i] + "']";
            if (i != 2) {
                var divHeight = $(".container").outerHeight(true) * toSize * 0.7;
            }
            else {
                var divHeight = $(".container").outerHeight(true) * toSize;
            }
            var headHeight = $(target + " > .ground-label").outerHeight(true);
            $(target + " > pre").css("height", divHeight - headHeight - 2 + "px");
            $(target + " > textarea").css("height", divHeight - headHeight - 1 + "px");
        }
    }
    else {
        for (var i = 0; i < editorId.length; i++) {
            var target = ".collapse-block[id='" + editorId[i] + "']";
            var divHeight = $(target).height();
            var headHeight = $(target + " > .ground-label").outerHeight(true);
            $(target + " > pre").css("height", divHeight - headHeight - 2 + "px");
            $(target + " > textarea").css("height", divHeight - headHeight - 1 + "px");
        }
    }
}
function inputToggle(toId, target, notTarget, id, notFocusId) {
    if (toId != "both") {
        inputFocus = id;
        var headHeight = $(target + " > .ground-label").outerHeight(true);
        var textareaHeight = $(".input-area").outerHeight(true) * 0.9 - headHeight - 2;
        $(target).css("height", "90%");
        $(target + " > pre").css({ "display": "", "opacity": "1", "height": textareaHeight + "px" });
        $(notTarget).css("height", "auto");
        $(notTarget + " > pre").css({ height: "0", opacity: "0", "display": "none" });
    }
    else {
        inputFocus = "both";
        var headHeight = $(target + " > .ground-label").outerHeight(true);
        var textareaHeight = $(".input-area").outerHeight(true) * 0.5 - headHeight - 2;
        $(notTarget).css("height", "auto");
        $(notTarget + " > pre").css({ height: "0", opacity: "0", "display": "none" });
        $(target).css("height", "auto");
        $(target + " > pre").css({ height: "0", opacity: "0", "display": "none" });
        $(notTarget).css("height", "50%");
        $(notTarget + " > pre").css({ "display": "", "opacity": "1", "height": textareaHeight + "px" });
        $(target).css("height", "50%");
        $(target + " > pre").css({ "display": "", "opacity": "1", "height": textareaHeight + "px" });
    }
}
function setP4d(fileName, displayName) {
    $.ajax({
        type: "GET",
        url: "./p4d/" + fileName + ".nez",
        success: function (res) {
            if (pegEditor != null) {
                pegEditor.setValue(res);
                pegEditor.clearSelection();
                pegEditor.gotoLine(0);
                $("span[id='peg4d'] > .dropdown > button").text(displayName + "    ");
                $("span[id='peg4d'] > .dropdown > button").append("<span class=caret>");
            }
        }
    });
}
function setNez(fileName, displayName) {
    $.ajax({
        type: "GET",
        url: "./p4d/" + fileName + ".nez",
        success: function (res) {
            if (nezEditor != null) {
                nezEditor.setValue(res);
                nezEditor.clearSelection();
                nezEditor.gotoLine(0);
                $("span[id='nez'] > .dropdown > button").text(displayName + "    ");
                $("span[id='nez'] > .dropdown > button").append("<span class=caret>");
            }
        }
    });
}
function setSource() {
    var target = $('.fileUploader');
    target.each(function () {
        var txt = $(this).find('.txt');
        console.log(txt);
        if (txt.length == 0) {
            var txt = $("span[id='peg4d'] > .dropdown > .txt");
        }
        var btn = $(this).find('.btn');
        var uploader = $(this).find('.uploader');
        uploader.bind('change', function (e) {
            var targetInput = e.target;
            var files = targetInput.files;
            console.log(files);
            txt.val($(this).val());
            txt.text(files[0].name);
            setEditorId.push($(this).attr("id"));
            reader.readAsText(files[0]);
        });
        btn.bind('click', function (event) {
            event.preventDefault();
            return false;
        });
    });
    reader.addEventListener("load", function () {
        console.log(setEditorId);
        switch (setEditorId.shift()) {
            case "source":
                inputEditor.setValue(reader.result);
                inputEditor.clearSelection();
                inputEditor.gotoLine(0);
                break;
            case "p4d":
                pegEditor.setValue(reader.result);
                pegEditor.clearSelection();
                pegEditor.gotoLine(0);
                break;
            case "nez":
                nezEditor.setValue(reader.result);
                nezEditor.clearSelection();
                nezEditor.gotoLine(0);
                break;
            case "bxnez":
                bxnezEditor.setValue(reader.result);
                bxnezEditor.clearSelection();
                bxnezEditor.gotoLine(0);
                break;
        }
    });
}
