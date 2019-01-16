function InitPopupMenuHandler(s, e) {
    $(".attachments-container .itm").bind("contextmenu", function (evt) {
        s.objectData = $(this).data('object');
        if (s.objectData) {
            s.ShowAtPos(evt.pageX, evt.pageY);
            evt.preventDefault();
        }
    });
}
function OnPopupMenuItemClick(s, e) {
    if (s.objectData) {
        if (e.item.name === 'prop') {
            var data = { ReferenceData: { ReferenceId: s.objectData.referenceId }, ObjectId: s.objectData.id };
            ax.post('/Commands/GetNewPopup/', data);
        } else {
            window.open('/' + s.objectData.referenceName + '/?FocusId=' + s.objectData.id)
        }
    }
}
function RemoveController(ctrl) {
    var value = $('#mail_comment_box textarea').val();
    var TaskId = CurrentGrid.GetSelectedKeysOnPage()[0];
    ax.post('/Mail/RemoveController/',{ value: value, TaskId: TaskId },function(){
        $('.Task_panel').each(function () {
            if ($(this).is(":visible")) {
                var panel = eval($(this).attr("id"));
                panel.PerformCallback();
            }
        });
        CurrentGlobal.PerformCallback();
    });
}

function TaskControllerSet(grid, CanChange, cName, guid, date) {
    if (CanChange === "True") {
        $('._c_change').css('display', 'inline-block');
        $('._c_remove').css('display', 'inline-block');
        $('._c_set').hide();
    }
    else {
        $('._c_set').css('display', 'inline-block');
        $('._c_change').hide();
        $('._c_remove').hide();
    }
    $('#task_controller').val(cName);
    $('#task_controller').attr('guid', guid);
    $('#dateTime_I').val(date)
}
function showReplain(can) {
    var $elem = $('._replan');
    if (can === "True") {
        $elem.css('display', 'inline-block');
        $elem.removeClass('no_display');
    }
    else
    {
        $elem.hide();
        $elem.addClass('no_display');
    }
}
function RefreshDesktop(panel) {
    var panel = eval(panel);
    panel.PerformCallback();
}
function SetPercents(ctrl, id) {
    var value = ctrl.prev().val();
    ax.post('/Mail/SetTaskPercents/', { id: id, val: value });
}

var TaskComment = "";
var CurrentCommand = null;

function BoxCommentClick(ctrl) {
    var value = dx_task_acceptText.GetValue();
    TaskComment = value;
    var type = $('.draggable_task').first().attr('type');
    if (CurrentCommand != null) CurrentCommand.trigger('click');
    else {
        var command = global.find(".CommandButton-Line-Container[type=" + type + "]");
        command.trigger('click');
    }
}
function setTaskSols(ctrl, id) {
    var guids = solutionsgrid.GetSelectedKeysOnPage();
    ChosingTaskSolution.Hide();
    CurrentCommand = ctrl;
    ExecuteTaskCom(ctrl, id, ChosingTaskSolution.cpExceptionTable ? 'Complete' : 'AsSolution', guids);
}

function expandSolMenu() {
    ChosingTaskSolution.Show();
}

function acceptBoxConfirm(s, e) {
    dx_task_acceptText.SetValue(typeof(pcAcceptBoxComment) != 'undefined' ? pcAcceptBoxComment.GetValue() : '');
    dx_task_acceptText.cpObjects = typeof(dxAcceptBoxGridView) != 'undefined' ? dxAcceptBoxGridView.cpObjects : {};
    delete window.dxAcceptBoxGridView;
    dx_task_acceptText.cpVariableData = variableHelper.GetVariableData();
    console.log(dx_task_acceptText.cpVariableData);
    BoxCommentClick($(s.mainElement))
    setTimeout(function () { CloseDialog($(s.mainElement)) }, 100);
    dx_task_acceptText.cpObjects = null;
    dx_task_acceptText.cpVariableData = null;

}
function removeFromBox(s, e) {
    var keys = dxAcceptBoxGridView.GetSelectedKeysOnPage(),
    objects = JSON.parse(dxAcceptBoxGridView.cpObjects);
    for (var i = 0 ; i < keys.length; i++) {
        var item = objects.filter(function (item, index) { console.log(index); return item.guid === keys[i] });
        if (item)
            objects.remove(item[0]);
    }
    dxAcceptBoxGridView.cpObjects = objects;
    dxAcceptBoxGridView.PerformCallback();
}
function attachObjectsOnAcceptBox(s, e) {
    var panel = s.GetPopupCallbackPanel(s, e);
    var selected = panel.GetSelectedKeys() || [],
    old = typeof (dxAcceptBoxGridView.cpObjects) == 'string' ? JSON.parse(dxAcceptBoxGridView.cpObjects) : dxAcceptBoxGridView.cpObjects || [];
    if (!$.isArray(selected)) selected = [selected];
    for (var i = 0 ; i < selected.length; i++) {
        old.push({ RefId: panel.cpReferenceId, id: selected[i] });
    }
    dxAcceptBoxGridView.cpObjects = old;
    CloseDialog($(s.mainElement));
    console.log(dxAcceptBoxGridView.cpObjects);
    dxAcceptBoxGridView.PerformCallback();
}
                                   
function UploadFile(ctrl) {
    var point = ctrl.parents('form');
    point.submit();
}

function UploadComplete(ctrl) {

    var content = $("#UploadTarget").contents().find("#jsonResult")[0];
    if (typeof content === 'undefined')
        return;

    var FileInfo = contentinnerHTML;
    if (FileInfo.IsValid)
    {
        ctrl.parents('tr').first().fadeIn("slow");
        var point = ctrl.parents('div').first();
        SetAttachmentRow(point, FileInfo.ImagePath, FileInfo.Name);
    }
    else ShowError(FileInfo.Name);
    Indicator.hide();
}

function DelMsg(id, folderId, ctrl) {
    CloseDialog(ctrl);
    ax.post('/Mail/DelMsg', { Id: id, FolderId: folderId });
}


function Reply(Id, FolderId, ToAll, isResend) {
    ax.post('/Mail/GetReplyMsg', { id: Id, folderId: FolderId, toAll: ToAll, isResend: isResend
    }, function (data) {AddDialog(data.Text); });}

function ReadMessage(control, id)
{
    try
    {
        var parent = control.parents('.global-panel').first();
        var grid_id = parent.find('.Grid-Control-Class2:first').attr("id");
        var grid = eval(grid_id);
        var tree_id = parent.find('.m_tree_main:first').attr("id");
        console.log(tree_id);
        var tree = eval(tree_id);
        var key = grid.GetSelectedKeysOnPage()[0];
        var panel = parent.attr("id");
        if (id != null) key = id;
        ax.post('/Mail/OpenItem', { GlobalId: key, IsMail: grid.cpWinType === 'Mail', panel: panel }, function(data) {
            AddDialog(data.Text);
            tree.PerformDataCallback();
            InitPopupMenuHandler(dxAttachmentPopup);
            grid.onMessageReaded();
        });
    }
    catch (er)
    {
        console.log(er);
    }
}

function DeleteMailItem(ctrl)
{
    InitilizeGrid(ctrl);
    var keys = CurrentGrid.GetSelectedKeysOnPage();
    if (confirm(_localMessages.removeAlert))
        ax.post('/Mail/DeleteItems', { keys: keys }, function() { Reload.Grid(); });
}


var Taskpoint = null;
var tLoad = null;

function ChangeTaskLink(IsController, ctrl) {
    Taskpoint = ctrl;
    var parent = $(ctrl.mainElement).parents('.mail').first();
    tLoad = parent.find('.diag-load img:first');
    tLoad.show();
    ax.post('/Mail/ChangeTaskLink/', { IsController: IsController }, function (data) {
        AddDialog(data.Text);
    });
}

function SetTaskLink(s, e) {
    var parent = $(s.mainElement).parents('.dxpc-content').first(),
    point = parent.find('.Reference-Control:first');
    InitilizeGrid(point);
    var keys = CurrentGlobal.GetSelectedKeys();
    ax.post('/Mail/GetObjName/', { ids: keys }, function (resp) {
        if (Taskpoint.cpTokenBox) {
            for (var i = 0; i < resp.data.length; i++) {
                Taskpoint.AddTokenInternal(resp.data[i].name, resp.data[i].id);
            }
            
        } else {
            Taskpoint.SetValue(resp.data[0].name);
            Taskpoint.cpKey = resp.data[0].id;
        }
        CloseDialog($(s.mainElement));
    })
}
function expandtable(ctrl) {
    var parent = ctrl.parents('.Executors').first(),
        tab = parent.find('.execut-tab'),
        grid = eval(parent.find('.execut-tab > table').attr('id')),
        point = ctrl.parents('div').first();
    if (tab.is(":visible")) {
        for (var i = 0; i < grid.cpExecutors.length; i++)
            point.append('<span class="addex-row">' + grid.cpExecutors[i] + '; </span>');
        tab.hide();
        ctrl.css({ 'transform': 'rotate(-180deg)' });
    }
    else {
        parent.find('.addex-row').remove();
        tab.show();
        ctrl.css({ 'transform': 'rotate(-0deg)' });
    }
}

var desktopHelper = {
    onDxCallbackError: function (s, e) {
        e.handled = true;
        OnCallBackError(s,e);
        console.log(e);
    }
}
function AttachToProcess(attach) {
    var gridObjects = JSON.parse(dxAcceptBoxGridView.cpObjects);
    var objects = dxAcceptBoxGridView.GetSelectedKeysOnPage().map(function (item) {
        for (var i = 0 ; i < gridObjects.length ; i++) {
            if (gridObjects[i].guid === item)
                gridObjects[i].isEngaged = attach;
        }
    });
    pcAcceptBoxInclude.SetVisible(!attach);
    pcAcceptBoxExclude.SetVisible(attach);
    dxAcceptBoxGridView.cpObjects = JSON.stringify(gridObjects);
    dxAcceptBoxGridView.PerformCallback();
    console.log(objects);
    //ax.post('/Mail/AttachToProcess/', { objects: objects, attach: attach }, function () {
    //});
}
function onDxAcceptBoxGridClick(s, e) {
    pcAcceptBoxRemove.SetVisible(true);
    var gridObjects = JSON.parse(dxAcceptBoxGridView.cpObjects);
    var key = s.GetRowKey(e.visibleIndex);
    for (var i = 0 ; i < gridObjects.length ; i++) {
        if (gridObjects[i].guid === key)
        {
            pcAcceptBoxInclude.SetVisible(!gridObjects[i].isEngaged);
            pcAcceptBoxExclude.SetVisible(gridObjects[i].isEngaged);
            return;
        }
    }
}

variableHelper = {
    OnVariableListChange: function (s, e) {
        if (s.cpTaskId) {
            variableHelper.taskId = s.cpTaskId;
            ax.post('/Mail/GetVariableDialog/',{ taskId: s.cpTaskId,variable: s.cpVariableName },function (data) {
                AddDialog(data.Text);
                variableHelper.control = s;
            });
        }
        else {
            var data = s.cpData || s.cpValue || s.GetValue();
            ax.post('/FilterReference/GetVariableList', { path:s.cpPath, data: data } ,function (data) {
                AddDialog(data.Text);
                variableHelper.control = s;
            });
        }
    },
    AddVariableControl: function (s, e) {
        var table = $("#variableGrid"),
            taskId = table.data('taskid'), variable = table.data('variable'),
            path = table.data('path');
        ax.post('/Mail/AddVariableRow/',{ taskId: taskId, variable: variable, path:path },function (data) {
            table.append(data.Text);
        });
    },
    DeleteVariableControl: function (s, e) {
        $('.dx_variableBox_checkbox').each(function () {
            var box = eval($(this).attr('id'));
            if(box.GetChecked())
                $(this).parents('tr').remove();
        });
    },
    SetVariablesData: function (s, e) {
        var value = [], text = "";
        $('#variableGrid .value_div > table').each(function () {
            var dx = eval($(this).attr('id'));
            var t = dx.GetInputElement().value;
            value.push((dx.isASPxClientTextBox || dx.GetNumber) ? t : (dx.cpValue || dx.cpData));
            if (t)
                text += t + "; ";
        });
        variableHelper.control.cpValue = JSON.stringify(value);
        variableHelper.control.SetText(text);
        CloseDialog($(s.mainElement));
        var data = variableHelper.GetVariableData();
        variableHelper.taskId && ax.post('/Mail/SetVariableValue', { taskId: variableHelper.taskId, variableData: data, source:null });
    },
    GetVariableData: function () {
        var table = $('#pcTaskAcceptBox .task_user_dialog_table:first');
        if (!table.length)
            return null;
        var vars = [];
        table.find('.value_div > table').each(function () {
            var dx = eval($(this).attr('id'));
            var data = { Name: dx.cpVariableName, Value: dx.cpValue ? dx.cpValue : dx.GetValue() }
            if (dx.cpData)
                data.value = JSON.stringify(dx.cpData);
            vars.push(data);
        });
        return vars;
    },
    GetGridData: function (s) {
        var data = []
        $(s.mainElement).find('.value_column_').each(function () { 
            var id = $(this).find('.value_div > table').attr('id');
            var control = eval(id);
            var value = control.cpData || control.cpValue || control.GetValue() || "";
            data.push(value);
        });
        return JSON.stringify(data);
    }
}

function ClearMailCache(s, e) {
    CloseDialog($(s.mainElement));
    ax.post('/Mail/ClearAttachmentCache', {}, function () { });
}