
window.onpopstate = function (e) {
    document.title = _localMessages.loading;
    $('a').removeClass('active-link');
    $('a:not(.dx').each(function () {
        if ($(this).attr('href') == window.location.pathname)
            $(this).addClass('active-link');
    });
}

//Объект перезагузки ( дерево, таблица, вся панель )
var Reload =
    {
        All: function () {
            if (typeof CurrentGrid != "undefined" && CurrentGrid != null)
                CurrentGrid.PerformCallback();

            if (typeof CurrentTree != "undefined" && CurrentTree != null)
                CurrentTree.PerformCallback();

            if (typeof CurrentHeader != "undefined" && CurrentHeader != null)
                CurrentHeader.PerformCallback();
        },
        Grid: function () {
            if (typeof CurrentGrid != "undefined" && CurrentGrid != null)
                CurrentGrid.PerformCallback();
        },
        Tree: function () {
            if (typeof CurrentTree != "undefined" && CurrentTree != null)
                CurrentTree.PerformCallback();
        },
        Global: function () {
            if (typeof CurrentGlobal != "undefined" && CurrentGlobal != null)
                if (CurrentGlobal.mainElement && $(CurrentGlobal.mainElement).is(':visible'))
                    CurrentGlobal.PerformCallback();
        }
    }

function RecoverObjects(ctrl) {
    InitilizeGrid(ctrl);
    var keys = CurrentGrid.GetSelectedKeysOnPage();
    ax.post(ax.links.recover, { container: keys }, function (d) { CurrentGrid.PerformCallback(); });
}


function OpenNewPopup(ObjId, ReferenceData, guid, source, fictive, child) {
    if (typeof ObjId != "undefined" && ObjId != "") {
        var Guid = guid ? guid : null,
            souce = source ? source : null,
            Fictive = fictive ? true : false,
            Child = child ? child : false,
            ParentId = CurrentGlobal ? CurrentGlobal.GetParentId() : null;
        if (CurrentTree && CurrentTree.cpStructureMode) {
            var row = $(CurrentTree.GetRowByNodeKey(CurrentTree.GetFocusedNodeKey()));
            ReferenceData.ReferenceId = row.data('referenceid');
        }
        ax.post(ax.links.objectProperties, {
            ReferenceData: ReferenceData,
            ObjectId: ObjId,
            ToOneGuid: Guid,
            SourceId: source,
            Fictive: Fictive,
            Child: Child,
            ParentId: ParentId,
            fromDesktop: this.fromDesktop
        }, function (data) {
        });
    }
}

function ChangeUserControl(ctrl, ReferenceGuid, ParameterGuid, ParameterName, add) {
    ChangingControl = ctrl;
    var par = ctrl.parents('.TestPopupclass:first');
    add = typeof add == 'undefined' ? null : add;
    if (add && typeof Filter != 'undefined') {
        Filter.currentControl = ctrl;
    }
    ax.post(ax.links.userControl, { ReferenceGuid: ReferenceGuid, ParameterGuid: ParameterGuid, ParameterName: ParameterName, add: add },
        function (data) {
            AddDialog(data.Text);
        });
}

function setUserValue(ctrl, RefId, guid, setted) {
    var self = this,
        parent = ctrl.parents('.dxpc-content').first(),
        LinkGuid = ctrl.attr("guid"),
        panel = eval(parent.find('.global-panel:first').attr('id')),
        key = (typeof panel != 'undefined') ? panel.GetSelectedKey() : setted,
        id = parseInt(RefId),
        isClass = typeof setted != 'undefined';
    ax.post(ax.links.getControlValue, { ReferenceId: id, ObjectId: key, ParameterGuid: guid, IsClass: isClass }, function (data) {
        //this.cpUserControl
        new valueHelper(data, self).SetValue();
        CloseLinkEdit(ctrl);
        CloseDialog(ctrl);
    });
}

// Взять на редактирвоание
function CheckOutSelectedObjects(ctrl, id) {
    InitilizeGrid(ctrl);
    var SelectedRows = CurrentGlobal.GetSelectedKeys(),
        Guid = null;
    if (ctrl && ctrl.parents('.ManyTableHeader').length)
        Guid = ctrl.parents('.ToManyLinkedTable').data('guid');

    ax.post(ax.links.CheckOut, { Container: SelectedRows, ReferenceId: id, Guid: Guid }, function (data) {
        if (!OnlyTree)
            Reload.Grid();
        CurrentTree.PerformCallback();
        Indicator.hide();
        CurrentGrid.ShowCommand('_canc_edit', '_checkin');
        CurrentGlobal.HideCommand('_edit_c');
    });
}

//Применить изменения
function CheckInSelectedObjects(ctrl, IsDesktop, RefId) {
    IsCheckedOut = IsDesktop;
    CurrentRefId = RefId;
    InitilizeGrid(ctrl);
    dx_acceptText.SetText('');
    $('#draggable').fadeIn('fast');
    $('#draggable').data('keys', CurrentGlobal.GetSelectedKeys());
}



//Закрыть диалог комментариев и сохранить изменения
function SendCommentAndAccept(comment) {
    if (!comment) {
        ShowError(_localMessages.commentError);
        return false;
    }
    var keys = $('#draggable').data('keys');
    if (!IsCheckedOut) {
        var Guid = (CurrentGrid && CurrentGrid.Guid) ? CurrentGrid.Guid : null;
        ax.post(ax.links.CheckIn, { Container: keys, Comment: comment, ReferenceId: CurrentGlobal.GetReferenceData().ReferenceId, Guid: Guid }, function (data) {
            CurrentGlobal.Reload();
            CurrentGlobal.HideCommand('_canc_edit', '_checkin');
            CurrentGrid.ShowCommand('_edit_c');
        });

    }
    else {
        ax.post(ax.links.CheckInDesktop, { GuidContainer: keys, Comment: comment }, function (data) {
            Reload.Grid();
        })
    }
    $('#draggable').fadeOut('slow');
}


//Отменить изменения
function CancelCheckInSelectedObjects(ctrl, RefId, IsDesktop) {
    InitilizeGrid(ctrl);
    var SelectedRows = CurrentGlobal.GetSelectedKeys();
    CancelCheckInSelectedObjects
    if (!IsDesktop) {
        var Guid = (CurrentGrid && CurrentGrid.Guid) ? CurrentGrid.Guid : null;
        ax.post(ax.links.CancelChanges, { Container: SelectedRows, ReferenceId: RefId, Guid: Guid }, function (data) {
            var control = (CurrentTree && CurrentTree.cpStructureMode) ? CurrentTree : CurrentGlobal;
            control.PerformCallback();
            Indicator.hide();
            CurrentGlobal.HideCommand('_canc_edit', '_checkin');
            CurrentGrid.ShowCommand('_edit_c');
        })
    }
    else {
        CancelEditDesktop();
    }
}


//Удалить объекты
function DeleteSelectedObject(ctrl, RefId) {
    InitilizeGrid(ctrl);
    var SelectedRows = CurrentGlobal.GetSelectedKeys();
    parent = ctrl.parents('.global-panel').first();
    if (confirm(CurrentGlobal.cpSupportsRecycleBin ? _localMessages.removeAlert2 : _localMessages.removeAlert)) {
        if (!ctrl.parents('.TableContainerColumn').length) {
            var keys = $.makeArray($('.object-header-id').map(function () { return $(this).text(); }));
            for (var i = 0; i < keys.length; i = i + 1) {
                var contains = $.inArray(keys[i], SelectedRows)
                if (contains == 0) {
                    ShowError(_localMessages.removeAlertDiag);
                    return;
                }
            }
        }

        ax.post(ax.links.DeleteObjects, { Container: SelectedRows }, function (data) {
            var control = (CurrentTree && CurrentTree.cpStructureMode) ? CurrentTree : CurrentGlobal;
            control && control.PerformCallback();
        });
    }
}


function CreateMailItem(ctrl, IsMail) {
    InitilizeGrid(ctrl);
    var parent = ctrl.parents('.global-panel').first();
    var treepanel = parent.find('.Main-panel:first').attr("id");
    var gridname = CurrentGrid.name;
    var panel = parent.attr("id");
    ax.post(ax.links.createMail, { IsMail: IsMail, panel: panel }, function (data) {
        //  $('#MainPage').append(data.Text);
        AddDialog(data.Text);
    })
}

function DownloadThisFile(ctrl) {
    InitilizeGrid(ctrl);
    if (CurrentKey == null) {
        alert(_localMessages.noOneObject);
    }
    else {
        var keys = CurrentGlobal ? CurrentGlobal.GetSelectedKeys() : [CurrentKey];
        if (keys.length > 1 && typeof keys === 'object') {
            var zipUrl = '/FileReference/DownloadMyFile?ObjectId=' + keys[0];
            for (var i = 1; i < keys.length; i++)
                zipUrl += ('&ObjectId=' + keys[i]);
            window.open(zipUrl, '_blank_');
        }
        else {
            window.open('/FileReference/DownloadMyFile?ObjectId=' + CurrentKey, '_blank_');
        }
    }
}

_loader = "<div class='loaded_pane'><div class='loader'></div></div>";
var DELAY = 700, clicks = 0, timer = null;
function OnSelectionGridControl(refId, ObjId, Selected, s, e) {
    if (Selected) {

        if (!ObjId)
            return false;

        var ParentId = null;
        if (s) {

            clicks++;  //count clicks
            viewStorage.setFocusId(s.GetReferenceData().ReferenceId, ObjId);
            if (clicks === 1) {
                timer = setTimeout(function () {
                    clicks = 0;
                    var row = $(s.GetRow(e.visibleIndex));
                    InitilizeGrid(row);

                    if (!CurrentGlobal || CurrentGlobal.GetViewMode() == "Tree" || !s.cpUpdatePanelState) {
                        s.cpUpdatePanelState = true;
                        return false;
                    }

                    ParentId = CurrentGlobal.GetParentId();
                    RefreshPanel(refId, ObjId, ParentId, row);
                    var onclick = row.attr('onclick');
                    eval(onclick);
                }, DELAY);

            } else {
                clearTimeout(timer);    //prevent single-click action
                // alert("Double Click");  //perform double-click action
                clicks = 0;             //after action performed, reset counter
            }
        }
    }
}

function RefreshPanel(RefId, ObjId, ParentId, control, justDo) {
    var panel = control.parents('.global-panel').first(),
        pane = panel.find('.properties-panel:visible');
    if (pane.length == 0 || !CurrentGlobal.ShowPanel())
        return false;

    pane.append(_loader);
    var JustDo = justDo ? true : false,
        saveInCache = !panel.parents('.TableContainerColumn').length;
    popupChild = !!panel.parents('.DynamicDialogContainer').length
    ax.post(ax.links.panelDialog, {
        ReferenceId: RefId, ObjectId: ObjId, ParentId: ParentId, saveInCache: true,
        JustDo: JustDo, saveInCache: saveInCache,
        popupChild: popupChild
    }, function (data) {
        eval(panel.attr('id')).OnPanelStateReady(data, pane);
    });
}
function AddDialog(content) {
    var container = $("<div class='DynamicDialogContainer'></div>");
    container.append(content);
    $('#DialogMainContainer').append(container);
}

function SendMessage(ctrl, editor, send, panel) {
    InitilizeGrid(ctrl);
    var parent = ctrl.parents('.mail').first();
    var containerTo = parent.find('.Address-To:first');
    var containerCopy = parent.find('.Address-Copy:first');
    var theme = parent.find('.Adr-theme:first').val();
    var To = [];
    var Copy = [];
    var Attachments = [];
    //var htmleditor = eval(editor);
    containerTo.find('.adr-item').each(function () {
        To.push({
            "key": $(this).attr("key"), "type": $(this).attr("type"),
            "mailType": $(this).data('mail-type')
        });
    });
    var InetUsers = containerTo.find('textarea').val();
    containerCopy.find('.adr-item').each(function () {
        Copy.push({
            "key": $(this).attr("key"), "type": $(this).attr("type"),
            "mailType": $(this).data('mail-type')
        });
    });
    var textType = mail_type.GetValue(),
        item = parent.find('.m-table:first'),
        frame = item.find('.ext-col iframe:first'),
        conts = frame.contents(),
        editor = eval(parent.find('.ml-editor2:first').attr('id')),
        imgs = conts.find('img'),
        text = editor.GetHtml(),
        Acc = (typeof mail_acc !== "undefined") ? mail_acc.GetValue() : null;
    imgs.each(function () {
        Attachments.push($(this).attr("src"));
    });
    var msg = {
        to: To,
        copy: Copy,
        theme: theme,
        formatText: text,
        bodyType: textType,
        send: send,
        Attachments: Attachments,
        AccGuid: Acc
    };
    ax.post('/Mail/ValidateMessage/', { msg: msg }, function (data) {
        // CloseDialog(ctrl);
        var waitingCallback = dialogHelper.hideUntilCallback(ctrl);
        ax.post(ax.links.sendMessage, { send: send, guid: Acc }, function (data) {
            waitingCallback.dispose();
        }, function (data) {
            waitingCallback.show();
        });
    });
}
function SendTask(ctrl, editor, send, panel) {
    var parent = ctrl.parents('.mail').first();
    var containerTo = parent.find('.Address-To:first');
    var theme = parent.find('.Adr-theme:first').val();
    var To = new Array();
    // var htmleditor = eval(editor);
    containerTo.find('.adr-item').each(function () {
        var key = $(this).attr("key");
        var type = $(this).attr("type");
        To.push({ "key": key, "type": type, mailType: $(this).data('mail-type') });
    });
    var StartDate = task_startDate.GetValue();
    var EndDate = task_endDate.GetValue();
    var CheckDate = task_checkDate.GetValue();
    var PercentEnded = $('#PercentComplete').val();
    var From = task_from.cpKey;
    var Controller = task_controller.cpKey;
    var frame = parent.find('.ext-col iframe:first');
    var conts = frame.contents();
    //  var imgs = conts.find('img');
    var text = conts.find("html").html();
    var textType = task_type.GetValue();
    var Priority = task_priority.GetValue();
    var IsReplanned = parent.attr('data-replan') == "True";
    var TaskModel = {
        "to": To, "theme": theme, "formatText": text, "bodyType": textType, "StartDate": StartDate, "EndDate": EndDate, "CheckDate": CheckDate,
        "PercentEnded": PercentEnded, "send": send, "Priority": Priority, "From": From, "Controller": Controller, "IsReplanned": IsReplanned,
    };
    if (typeof (task_responsible) != 'undefined') {
        if (!task_responsible.cpKey)
            return alert('Не задан ответственный');
        TaskModel.responsible = task_responsible.cpKey;
    }
    if (typeof (task_notify_tokenBox) != 'undefined') {
        TaskModel.copyTo = task_notify_tokenBox.GetTokenValuesCollection();
    }
    ax.post('/Mail/SendTask', TaskModel, function () {
        CloseDialog(ctrl);
        Reload.Grid();
    });
}

var buildDialog = function (data) {
    if (data.Data) {
        switch (data.Data.type) {
            case ("OnlyInput"):
                var person = prompt(_localMessages.enterValue + ' ' + data.Data.title, data.Data.value);
                ax.post(ax.links.setMacroValue, { value: person, obj: null }, function (response) {
                });
                break;
            case ("InputDialog"):
                AddDialog(data.Data.content);
                break;
            case ("PropertiesDialog"):
                AddDialog(data.Data.content);
                break;
            case ("Variables"):
                AddDialog(data.Data.content);
                break;
        }
    }
}

function SaveChanges(ObjectId, ReferenceId, ctrl) {
    $(".SaveDialogChangesButton, .CancelDialogChangesButton").addClass("makeGreyAndUnpush");
    var fromPanel = ctrl.parents('.properties-panel').length ? true : false;
    var par = ctrl.parents('.EditButtons').first(),
        dCont = ctrl.parents('.DynamicDialogContainer').first();
    var DialogCont = ctrl.parents('.InvisibleContainer').first(),
        Mainparent = DialogCont.find('.WebDialogContent:first'),
        complex = Mainparent.find('.complex_table:first'),
        linkModel = null;
    if (complex.length != 0) {
        linkModel = dialogModel(ObjectId, ReferenceId, complex, true);
        linkModel.IsHierarchy = true;
        linkModel.ParentId = complex.data('parent');
        Mainparent.find('.complex_table:first').remove();
    }
    if (DialogCont.find('.box_error_item:visible').length) {
        DialogCont.find('.box_error_item:visible:first').effect("pulsate", { times: 2 }, 2000);
        return false;
    }
    var newModel = dialogModel(ObjectId, ReferenceId, DialogCont, false);
    newModel.HierarchyDialog = linkModel;
    CancelDocumentChanges(ctrl);
    var structTree = (CurrentTree && CurrentTree.cpStructureMode);
    if (structTree) {
        newModel.LinkContainer =
            {
                RootObjId: CurrentTree.structureHelper.masterCache.objectId,
                RootRefId: CurrentTree.structureHelper.masterCache.referenceId,
                LinkGuid: CurrentTree.structureHelper.masterCache.relationGuid
            };
    }
    ax.post(ax.links.saveDialog, { model: newModel, fromPanel: fromPanel }, function (response) {

        $(".makeGreyAndUnpush").removeClass("makeGreyAndUnpush");

        if (DialogCont.data('popout'))
            window.close();

        if (dCont.length) {
            CloseDialog(DialogCont);
            if ((!response.hasMacroContent && !response.jsContext) || (CurrentTree && CurrentTree.cpGanttTree) || structTree)
                CurrentGlobal.Reload();
        }
        else
            DisableDialog(par);
    },
        function (response) {
            $(".makeGreyAndUnpush").removeClass("makeGreyAndUnpush");
        });
}

function CancelDocumentChanges(ctrl) {
    var frame = ctrl.parents('.InvisibleContainer').first().find('iframe:first');
    if (!frame.length || !frame[0].contentWindow)
        return;
    var documentEditor = frame[0].contentWindow.documentEditor;
    if (documentEditor && documentEditor.HasUnsavedChanges()) {
        if (documentEditor.SaveDocumentCallback)
            documentEditor.SaveDocumentCallback();
        else {
            var proto = frame[0].contentWindow.__aspxRichEdit;
            documentEditor.core.commandManager.getCommand(proto.RichEditClientCommand.Undo).execute();
        }
    }
}

function CloseDialog(ctrl, id, RefId) {
    DisableDialog(ctrl);
    var DialogContainer = ctrl.parents('.DynamicDialogContainer').first(),
        prev = DialogContainer.prev();
    if (prev.find('.blocked_content').length) {
        prev.find('.blocked_content').remove();
    }
    else {
        $('.blocked_content').remove();
    }
    if (!DialogContainer.length && ctrl.hasClass('DynamicDialogContainer')) {
        ctrl.remove();
    }
    DialogContainer.remove();
    if (window.Filter)
        delete window.Filter;
    if (!RefId)
        return;
    ax.post(ax.links.closeDialog, { id: id, ReferenceId: RefId, showIndicator: false }, function (response) {
        if (ctrl.parents('.InvisibleContainer').data('popout'))
            window.close();
    });
}

var dialogModel = function (ObjectId, ReferenceId, parent, isLinked) {
    var DataArray = [];
    var OneToOneContainer = [];
    var ManyContainer = [];
    var Mainparent = parent.find('.WebDialogContent:first');
    Mainparent.find('.DialogTextBox').each(function () {
        var IsClosed = $(this).attr("IsClosed");
        var Value = $(this).val();
        if (this.type == "checkbox")
            Value = $(this).is(":checked");
        var Id = $(this).attr("ParId");
        $(this).val(Value);
        if (IsClosed === "False") {
            DataArray.push({ "name": Value, "ID": Id, "GroupID": "" });
        }
    });

    Mainparent.find('.dialog-checkbox').each(function () {
        var IsClosed = $(this).attr("IsClosed");
        var Value = $(this).prop('checked');
        var Id = $(this).attr("ParId");
        $(this).val(Value);
        if (IsClosed === "False") {
            DataArray.push({ "name": Value, "ID": Id, "GroupID": "" });
        }
    });
    Mainparent.find('.LinkedTextBox').each(function () {
        var guid = $(this).attr("guid");
        var id = $(this).attr("objid");
        if (id == null) id = 0;
        // UserControl
        if ($(this).hasClass('UserControl')) {
            var Id = $(this).attr('parameter');
            var Value = $(this).val();
            DataArray.push({ "name": Value, "ID": Id, "GroupID": "" });
        }
        else
            OneToOneContainer.push({ "RefObjId": id, "LinkGuid": guid });
    });
    Mainparent.find('.ToManyLinkedTable').each(function () {
        var guid = $(this).attr("tabindex");
        var rows = $(this).find('.LinkedTableRow');
        var TableContainer = [];
        rows.each(function () {
            var id = $(this).attr("objid");
            var RefId = $(this).attr("refid");
            TableContainer.push({ "id": id, "RefId": RefId });
        });
        ManyContainer.push({ "IdContainer": TableContainer, "guid": guid });

    });
    Mainparent.find('.dx-editor').each(function () {
        var item = $(this).find('.ml-editor:first');
        var htmlEditor = eval(item.attr("id"));
        var text = htmlEditor.htmlBackup;
        var id = $(this).attr("itemid");
        DataArray.push({ "name": text, "ID": id, "GroupID": "" });
    });
    return {
        Parameters: DataArray,
        ObjectId: ObjectId,
        ReferenceId: ReferenceId,
        OneToOneContainer: OneToOneContainer,
        ToManyContainer: ManyContainer,
        IsHierarchy: isLinked,
        HierarchyDialog: null,
        ParentId: null
    };
};

function AddLink(ctrl, id) {
    InitilizeGrid(ctrl);
    ax.post(ax.links.addLink, { ReferenceId: id }, function (data) {
        AddDialog(data.Text);
    });
}

function RemoveLink(ctrl, id) {
    InitilizeGrid(ctrl);
    var container = CurrentGlobal.GetSelectedKeys();
    var RefId = parseInt(id),
        parentId = CurrentGlobal.GetParentId(container[0] || container, true);
    ax.post(ax.links.removeLink, { container: container, ReferenceId: RefId, ParentId: parentId },
        function (d) {
            CurrentGlobal.PerformCallback();
        });
}

function GetCreationForm(ctrl, ClassId, RefId, Source, Guid, SourceId, filter) {

    Source = typeof Source == "undefined" ? null : Source;
    var ReferenceData = { ReferenceId: RefId }, changeState = typeof (this.changeState) != 'undefined',
        guid = Guid || null, RootObjectId = SourceId || null;
    if (ctrl && !ctrl.isASPxClientButton)
        InitilizeGrid(ctrl);
    if (CurrentTree && CurrentTree.cpGanttTree)
        guid = gantt.getTask(gantt._selected_task).Guid;
    ReferenceData = CurrentGlobal.GetReferenceData();
    if (CurrentGlobal.cpViewType === 'Complex' && !CurrentGlobal.cpLinkTable) {
        var tree = CurrentTree, key = tree.GetFocusedNodeKey(), row = $(tree.GetRowByNodeKey(key));
        if (key !== "0") {
            var data = row.data('init').c, checkedOut = data[2], name = row.data('name');
            if (!checkedOut && !confirm(_localMessages.checkOutParent(name)))
                return;
            changeState = checkedOut || true;
        }
    }
    $('.alt-menu').fadeOut('fast');
    if (CurrentTree && CurrentTree.cpStructureMode)
        ReferenceData.ReferenceId = parseInt(RefId);

    if (CurrentGlobal.GetViewMode() == "Tree" && !ctrl.isASPxClientButton)
    {
        // В режиме дерево, если выбран объект другого класса, показываем форму выбора класса

        var sourceClassId = ctrl.parent().data('formclass');
        var selectedId = parseInt(CurrentGlobal.GetSelectedKey());
        var structure = JSON.parse(CurrentTree.cpClassStructure).filter(function (item) { return item.id == sourceClassId; });
        if (!structure.length || structure[0].children.indexOf(selectedId) == -1)
            return ShowClassMenu(RefId, ctrl);
        else
            RootObjectId = selectedId;
    }


    ax.post(ax.links.creationForm, {
        ReferenceData: ReferenceData,
        ClassId: ClassId,
        source: Source,
        rootGuid: guid,
        rootObjectId: RootObjectId,
        filter: filter
    }, function (result) {
        if (ctrl && ctrl.isASPxClientButton)
            CloseDialog($(ctrl.mainElement));
        if (changeState && CurrentTree)
            CurrentTree.PerformCallback();
    })
}

function ShowClassMenu(id, ctrl, guid, RootObjectId) {
    InitilizeGrid(ctrl);
    $('.alt-menu:first').fadeOut('slow');
    var Guid = guid ? guid : null,
        Root = RootObjectId ? RootObjectId : null;

    if (ctrl.parents('.ManyTableHeader').length)
        Guid = ctrl.parents('.ToManyLinkedTable').data('guid');

    ax.post("/Commands/GetClassSelection", {
        ReferenceId: id, Guid: Guid, RootObjectId: Root, parentId: CurrentGlobal.GetSelectedKey()
    }, function (data) {
        //$('#ChooseClassContainer').empty()
        //$('#ChooseClassContainer').html(data.Text);
        //CreationDialogClass.Show();
        AddDialog(data.Text);
    });
}

function GetClassSelection(ctrl, id) {
    InitilizeGrid(ctrl);
    var lastUsedClass = $('.CreationClass-Bag-Item:last').attr("tabindex");
    if (typeof lastUsedClass === "undefined") {
        ShowClassMenu(id, ctrl);
    }
    else { GetCreationForm(null, lastUsedClass, id); }
}

function SetLinkChanges(ctrl, RootObjId, RootRefId, LinkRefId, IsAnyLink, LinkGuid) {
    if (!RootObjId && !RootRefId) {
        InitilizeGrid(ctrl);
        var refid = eval(ctrl.parents('.TestPopupclass').first().find('.global-panel:first').attr('id'))["cpReferenceId"];
        setUserValue.call(this, ctrl, refid);
        return;
    }
    var parent = ctrl.parents('.dxpc-content').first();
    // var LinkGuid = ctrl.attr("guid");
    var gridName = parent.find('.Grid-Control-Class2:first');
    InitilizeGrid(gridName);
    SelectedObjectId = CurrentGlobal.GetSelectedKey();
    if (IsLinkToOne == true) {
        AcceptOneToOneChanges(RootObjId, RootRefId, LinkGuid, LinkRefId);
    }
    else {
        AcceptOneToManyChanges(RootObjId, RootRefId, LinkGuid, LinkRefId, IsAnyLink);
    }
    CloseDialog(ctrl);
}

function AcceptOneToManyChanges(RootObjId, RootRefId, LinkGuid, LinkRefId, IsAnyLink) {
    var Ids = CurrentGlobal.GetSelectedKeys();
    if (IsAnyLink && !LinkRefId)
        LinkRefId = CurrentGlobal.GetReferenceData().ReferenceId;
    if (Ids) {
        ax.post(ax.links.toManyRow,
            { Ids: Ids, ReferenceId: LinkRefId, LinkGuid: LinkGuid, RootRefId: RootRefId, RootObjId: RootObjId, IsAnyLink: IsAnyLink },
            function (data) {
            });
    }
}



function AcceptOneToOneChanges(RootObjId, RootRefId, LinkGuid, LinkRefId) {
    var Ids = CurrentGlobal.GetSelectedKeys();
    var showParameterGuid = ChangingControl ? eval(ChangingControl.attr('id')).cpParameterGuid : null;
    if (Ids) {
        ax.post(ax.links.getOneToOne, {
            Ids: Ids,
            ReferenceId: LinkRefId,
            LinkGuid: LinkGuid,
            RootRefId: RootRefId,
            RootObjId: RootObjId,
            ShowParameterGuid: showParameterGuid
        }, function (response) {
            valueHelper.ReloadOneLink(response);
        })
    }
}

function SetTextBoxValue(TextBoxGuid, url, objectId, RootRefId, RootId) {
}

function AddObjectToManyTable(guid, row, count, NewUrl, RootRefId, RootId) {
    $(".ToManyLinkedTable").each(function () {
        var ThisGuid = $(this).attr("tabindex");
        var ThisRootId = parseInt($(this).attr("root-ref-id"));
        var ThisRootRefId = parseInt($(this).attr("root-id"));
        if (ThisGuid === guid && ThisRootId === parseInt(RootId) &&
            (ThisRootRefId === parseInt(RootRefId)))// || ThisRootRefId == 0))
        {
            $(this).append(row);
            var lastRow = $(this).find('.LinkedTableRow:last'),
                parent = lastRow.parents('.LinkedRowLine'),
                source = hexc(parent.css('backgroundColor'));
            parent.animate({
                backgroundColor: "#FFF38A",
            }, 800).animate({
                backgroundColor: source,
            }, 800);
            lastRow.attr("onclick", "javascript:CheckSelectedRow($(this))");
            $(this).trigger('change');
        }
    });
}

function hexc(colorval) {
    var parts = colorval.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    delete (parts[0]);
    for (var i = 1; i <= 3; ++i) {
        parts[i] = parseInt(parts[i]).toString(16);
        if (parts[i].length == 1) parts[i] = '0' + parts[i];
    }
    return '#' + parts.join('');
}


function ChangeObjectLink(data, control) {//LinkGuid, ctrl, ToOne, RootRefId, RootObjId) {
    var dx = control.mainElement ? true : false
    var inner = dx ? $(control.mainElement) : control;
    if (!dx) {
        data = control.parents().first().data('value');
    }
    if (!data)
    {
        data = JSON.parse(control.cpData);
        ChangingControl = control;
        return ChangeUserControl(inner, data.ReferenceGuid);
    }
    ChangingControl = inner;
    IsLinkToOne = data.toOne;
    InitilizeGrid(inner);
    //.find('.diag-load');
    if (dx && control.cpUserControl) {
        IsLinkToOne = true;
        ax.post('/DialogChanges/GetAnyReferenceObject/', { controlName: control.name, filters: JSON.parse(control.cpChosingData || null) }, function (result) {
            AddDialog(result.Text);
            // $('.waitCursor').removeClass('waitCursor');
        });
        return;
    }
    inner.parents('.InvisibleContainer:first').addClass('waitCursor');
    ax.post(ax.links.changeObjectLink, { viewModel: data },
        function (result) {
            AddDialog(result.Text); $('.waitCursor').removeClass('waitCursor');
        }, function () { $('.waitCursor').removeClass('waitCursor'); });
}



function ConnectToNomen(control, RefId) {
    var key = GetCurrentKey(control);
    ax.post('/Commands/ConnectNomenclature', { RefId: RefId, id: key }, function (data) {
        if (confirm(data.name + " " + _localMessages.NomenclatureSuccess))
            window.location = data.Text;
    });
}




function MailTreeExpand(s, e) {
    ax.post('/Desktop/SaveTreeKey', { key: e.node.text, showIndicator: false });
}

function GetCurrentKey(control) {
    try {
        if (!control.parents('.global-panel').length)
            return null;

        var parent = eval(control.parents('.global-panel').first().attr("id"));
        return parent.GetSelectedKey();
    }
    catch (err) {
        console.log(err);
        return null;
    }
}

function NewReferenceWindow(ctrl, TableName) {
    InitilizeGrid(ctrl);
    var key = CurrentGlobal.GetSelectedKey();
    if (key == null || key == "0")
        alert(_localMessages.noOneObject);
    else {
        window.open('/' + TableName + '/?RootId=' + key)
    }
}

function RemoveObjects(ctrl, link) {
    DeleteLinkContainer = [];
    var table = ctrl.parents('.ToManyLinkedTable').first();
    var RowsBoxes = table.find(".customcheckbox");
    RowsBoxes.each(function () {
        var objId = $(this).attr("name");
        if ($(this).prop('checked')) {
            DeleteLinkContainer.push(objId);
        }
    });
    if (DeleteLinkContainer.length != 0) {
        if (confirm("Remove Objects?"))
            ax.post('/Commands/DeleteObject', { Container: DeleteLinkContainer, Guid: link, ReferenceId: 0 }, function (data) {

                RowsBoxes.each(function () {
                    if ($(this).prop('checked')) {
                        var img = $(this).parents('.LinkedRowLine').first().find('.lock_icon:first');
                        img.attr('src', _localMessages.deletedIcon);
                    }
                });
            });
    }
    else {
        alert(_localMessages.noOneObject);
    }
}
function TaskController(control, type) {
    InitilizeGrid(control);
    var key = CurrentGrid.GetSelectedKeysOnPage()[0];
    $('#for_task_id').attr('task', key);
    switch (type) {
        case ('set'):
            if (confirm(_localMessages.tasks.setBehalf)) {
                ControllerDialog.Show();
            }
            break;
        case ('remove'):
            if (confirm(_localMessages.tasks.removeBehalf)) {
                $('#mail_comment_box').fadeIn('fast');
            }
            break;
        case ('change'):
            if (confirm(_localMessages.tasks.changeController)) {
                ControllerDialog.Show();
            }
            break;
        case ('Replan'):
            ax.post('/Mail/Replain', { TaskId: key }, function (data) {
                AddDialog(data.Text);
            });
            break;
    }
}

function SetAttachmentRow(point, img, name, IsTask) {
    var row = '<div class="_att_item" ><img  src=' + img + ' /><span title=' + _localMessages.remove + '>' + name + '</span><i></i></div>';
    if (IsTask)
        row = "<li class='itm'><div class='att-item'><img src = " + img + "  '/>" + name + "<div class='file-view'></div>" + "</div></li>";
    point.append(row);
}

function SetMailObj(s, e) {
    var ctrl = $(s.mainElement);
    var parent = $('.any_link_box:visible:first');
    var table = parent.find('table.Grid-Control-Class2:first');
    var grid = eval(table.attr("id"));
    var refId = parent.find('.Splitter-Container:first').attr('reference-key');
    var global = eval(grid.GetCallBackArguments().GlobalPanelName);
    var keys = global.GetSelectedKeys();
    ax.post('/Mail/UploadObject', { refId: refId, keys: keys }, function (data) {
        var objs = data.objects;
        var IsTask = mailPoint.hasClass('att_tsk');
        var row;
        mailPoint.fadeIn('fast');
        for (var i = 0; i <= objs.length - 1; i = i + 1) {
            mailPoint.parents('tr').first().fadeIn('fast');
            var diagRow = "<div class='file-view'></div>";
            SetAttachmentRow(mailPoint, objs[i].IconSource, objs[i].Name, IsTask)
            var point = mailPoint.find('.file-view:last');
            var wrapper = document.createElement('div');
            wrapper.innerHTML = objs[i].DialogString;
            point.append(wrapper);
        }
        CloseDialog(ctrl);
    });
}

function SetLine(windowName, panel) {
    var position = $('.Desktopcontainer').data('panel-position'),
        focused = $('.Desktopcontainer').data('focused'),
        pane = $('.global-panel[id=' + panel + ']:first'),
        lines = pane.find('.panel-opt:first'),
        index = 0,
        rows = pane.find('.view-config-menu:first'),
        property_pos = pane.find('._desktop_container:first').data('panel');
    if (focused != null) {
        var grid = eval(pane.find('.Grid-Control-Class2:first').attr("id"));
        grid.SelectItemsByKey(focused);
    }
    switch (windowName) {
        case 'Mail':
            $('.m_link:first').parents('a').first().addClass('sel_item');
            break;
        case 'Desktop':
            $('.d_link:first').parents('a').first().addClass('sel_item');
            break;
        case 'RecycleBin':
            $('.r_link:first').parents('a').first().addClass('sel_item');
    }
    switch (property_pos) {
        case 'none':
            break;
        case 'down':
            index = 1;
            break;
        case 'right':
            index = 2;
            break;
    }
    var point = lines.find('.opt-item:eq(' + index + '):first');
    point.trigger('click');
}

function DelAdrItem(ctrl) {
    ctrl.parents('div').first().remove();

}

function SetAddresses(ctrl) {
    var parent = ctrl.parents('table').first();
    var to = parent.find('.adr-area:eq(0)').html();
    var copy = parent.find('.adr-area:eq(1)').html();
    $('.m-table').each(function () {
        var mainto = $(this).find('.Address-To:first');
        var maincopy = $(this).find('.Address-Copy:first');
        mainto.prepend(to);
        maincopy.prepend(copy);

    });
    CloseDialog(ctrl);
}

function OpenAddrBook(ctrl, IsCommand) {
    ax.post('/Mail/AddressBook', { isCommand: IsCommand }, function (data) {
        AddDialog(data.Text);
    })
}

function CloseMailDiag(ctrl) {
    var point = ctrl.parents('.mail-dg').first();
    point.remove();
}

function UpdateClick(ctrl, RefId, IsDesktop, WindowType, tree) {
    var items = VisibleColumns.GetItemCount(), userCols = [], dataArray = [];
    for (var i = 0; i <= items; i = i + 1) {
        var item = VisibleColumns.GetItem(i);
        if (VisibleColumns.GetItem(i) != null) {
            var additional = item.texts[2];
            if (item.value.indexOf('?') !== -1) {
                additional = item.value.substr(item.value.indexOf("?") + 1);
                item.value = item.value.substring(0, item.value.indexOf("?"));
            }
            var colInfo = {
                "name": item.texts[0].toString(),
                "PathString": item.texts[1].toString()
            };
            if (item.texts[1].indexOf("$UserColumnItem") != -1) {
                colInfo.CalcType = item.texts[2];
                colInfo.StringData = item.value;
                userCols.push(colInfo);
            }
            else
                dataArray.push(colInfo);
        }
    }
    ax.post("/DisplayView/UpdateGridColumns/", {
        showIndicator: false,
        dataArray: dataArray,
        ReferenceId: RefId,
        IsDesktop: IsDesktop,
        WinType: WindowType,
        userColumns: userCols,
        tree: tree
    }, function (d) {
        //  if (!ctrl.is(':visible'))
        //     return;
        var grid = CurrentGlobal.Components().Grid;
        CloseDialog(ctrl);
        if (grid && grid.cpWinType) {
            CurrentGlobal.PerformCallback();
        }
        else {
            (tree ? CurrentTree : grid).PerformCallback();
        }
    });
}


function UpdateTreeListColumns(ctrl, RefId) {
    UpdateClick(ctrl, RefId, false, null, true);
    //var tree = (typeof VisibleColumns !== "undefined") ? VisibleColumns : TreeVisibleColumns;
    //if (typeof TreeVisibleColumns !== "undefined")
    //    tree = TreeVisibleColumns;
    //var items = tree.GetItemCount();
    //for (var i = 0; i <= items ; i = i + 1) {
    //    var item = tree.GetItem(i);
    //    if (tree.GetItem(i) != null) {
    //        /*
    //        key.substring(0, key.indexOf('?'));
    //        */
    //        var additional = item.texts[2];
    //        if (item.value.indexOf('?') !== -1) {
    //            additional = item.value.substr(item.value.indexOf("?") + 1);
    //            item.value = item.value.substring(0, item.value.indexOf("?"));
    //        }
    //        DataArray.push(
    //            {
    //                "name": item.texts[0].toString(),
    //                "ID": item.texts[1].toString(),
    //                "GroupID": item.value.toString(),
    //                "CurrentReferenceId": "0",
    //                "SlaveGroupId": additional
    //            });
    //    }
    //}
    //ax.post('/DisplayView/UpdateTreeListColumns/',{showIndicator:false, dataArray: DataArray, ReferenceId : RefId},function(){
    //    DataArray = [];
    //    if (!ctrl.is(':visible'))
    //        return;
    //    CloseDialog(ctrl);
    //    CurrentTree.PerformCallback();
    //});
}



// Добавление колонок 

function TreeListAddSelectedColumns(s, e) {
    TreeListCheckedNodes(ManagerAvailableColumns);
}

function TreeListCheckedNodes(TreeViewNodes) {
    for (var i = 0; i < TreeViewNodes.GetNodeCount(); i++) {
        var TreeNode = TreeViewNodes.GetNode(i);
        if (TreeNode.GetChecked() && TreeNode.GetNodeCount() === 0) {
            TreeVisibleColumns.BeginUpdate();
            TreeVisibleColumns.AddItem([TreeNode.GetText(), TreeNode.name.toString()], TreeNode.target.toString());
            TreeNode.SetVisible(false);
            TreeNode.SetChecked(false);
            TreeVisibleColumns.EndUpdate();
        }
        if (TreeViewNodes.GetNode(i).GetNodeCount() != 0) {
            TreeListCheckedNodes(TreeNode);
        }
    }
}

// Удаление Колонок

function RemoveSelectedColumns(s, e) {
    MoveSelectedItems(VisibleColumns);
}

function MoveSelectedItems(dstListBox) {
    dstListBox.BeginUpdate();
    var items = dstListBox.GetSelectedItems();
    AvailableColumns.cpExpandKeys = JSON.stringify(items.map(function (item) { return item.texts[1]; }));
    for (var i = items.length - 1; i >= 0; i = i - 1) {
        if (items[i] != null) {
            dstListBox.RemoveItem(items[i].index);
            var parentNode = AvailableColumns.GetNodeByName(items[i].texts[1] + "$Group")
            if (parentNode == null) {
                var parentPath = items[i].texts[1].split(".")[0] + "$Group";
                if (items[i].texts[1].indexOf("$SystemGroup") != -1) { //Системная
                    parentPath = "$SystemGroup";
                }
                if (items[i].texts[1].indexOf("$UserColumnItem") != -1) { //Пользовательские
                    parentPath = "$UserColumns";
                }

                parentNode = AvailableColumns.GetNodeByName(parentPath); // Системные параметры
                if (parentNode == null)
                    parentNode = AvailableColumns.GetNodeByName(items[i].texts[1].split(".")[0] + ".%Системные параметры");

                if (items[i].texts[1] == "0")
                    parentNode = AvailableColumns.GetNodeByText(items[i].texts[0]);

                if (items[i].texts[1].indexOf("->") != -1) { // Параметры связи
                    parentNode = AvailableColumns.GetNodeByName(items[i].texts[1].split('->')[0] + "$Group");
                }
            }
            if (parentNode && !parentNode.GetExpanded()) {
                AvailableColumns.SetNodeExpanded(parentNode);
            }
            else {
                var item = CurrentGlobal.cpWinType ? AvailableColumns.GetNodeByText(items[i].texts[0]) :
                    AvailableColumns.GetNodeByName(items[i].texts[1]);

                item.SetChecked(true);
                item.SetVisible(true);
            }
        }
    }

    dstListBox.EndUpdate();
}

function TreeListRemoveSelectedColumns(s, e) {
    TreeListMoveSelectedItems(TreeVisibleColumns);
}

function TreeListMoveSelectedItems(dstListBox) {
    dstListBox.BeginUpdate();
    var items = dstListBox.GetSelectedItems();
    for (var i = items.length - 1; i >= 0; i = i - 1) {
        if (items[i] != null) {
            dstListBox.RemoveItem(items[i].index);
            var t = ManagerAvailableColumns.GetNodeByName(items[i].texts[1]);
            t.SetVisible(true);
            t.SetChecked(true);
            if (t.parent)
                t.parent.SetExpanded(true);
        }
    }
    dstListBox.EndUpdate();
}

function TreeListVisibleColumnsChanged(s, e) {
    console.log(e);
}

function InitilizeGrid(ctrl) {
    if (ctrl && ctrl.parents('.ManyTableHeader').length) {
        var control = ctrl.parents('.ToManyLinkedTable').first();
        var Guid = ctrl.parents('.ToManyLinkedTable').data('guid'),
            table = $('.ToManyLinkedTable[data-guid=' + Guid + ']'),
            Container = $.makeArray(table.find(':checkbox:checked')
                .map(function () { return $(this).parents('.LinkedRowLine').first().data('id'); }));
        CurrentGrid = {
            Guid: Guid,
            GetSelectedKeysOnPage: function () {
                return Container;
            },

        }
        CurrentKey = CurrentGrid.GetSelectedKeysOnPage()[0];
        CurrentGlobal = {
            GetSelectedKeys: function () {
                return CurrentGrid.GetSelectedKeysOnPage();
            },
            GetReferenceData: function () {
                var data = control.data('referencedata');
                return data;
            },
            PerformCallback: function () { },
            GetParentId: function () { return null; },
            GetViewMode: function () {
                return "Grid";
            }, cpLinkTable: true
        }
        return;
    }

    var parent = ctrl.parents('.global-panel').first(),
        point = parent.find('.Grid-Control-Class2:first').attr("id"),
        item = parent.find('.view-config-menu:first .checkedItem');
    CurrentGrid = eval(point);
    var HeaderParent = ctrl.parents('.header-panel').first(),
        HeaderName = HeaderParent.attr("id");
    CurrentHeader = eval(HeaderName);
    var TreeParent = ctrl.parents('.global-panel').first().find('.TreelistDynamic:first'),
        TreeName = TreeParent.attr("id");
    CurrentTree = eval(TreeName);
    var GlobalName = parent.attr("id");
    CurrentGlobal = eval(GlobalName);
    CurrentKey = GetCurrentKey(ctrl);

    // var Guid = null;

}

function PropPanel(id, ctrl, position) {
    InitilizeGrid(ctrl);
    if (ctrl.parents('._file_folders').length)
        return;
    var panel = ctrl.parents('.global-panel').first();
    var container = panel.find('.properties-panel:first');
    var right = panel.find('.horizontal-split:first');
    var left = panel.find('.treelist-control:first');
    var container4 = panel.find('.view-config-menu:first');
    $('.hint--top').removeClass('Selected-Command'),
        saveInCache = !ctrl.parents('.TableContainerColumn').length;
    container4.hide();
    container.empty();
    var key = null;
    var items = container4.find('.opt-item');
    items.each(function () {
        $(this).removeClass('checkedItem');
    });
    var tree = CurrentGlobal.GetViewMode() == "Tree";
    if (tree) {
        var item = container.clone();
        left.find('.tree-prop:first').append(item);
        container = left.find('.properties-panel:first');
        right = left;
    }
    var splitterPosition,
        ParentId = CurrentGlobal.GetParentId(),
        afterResizeHelper = new (function () {
            var _getControl = function () {
                if (typeof (userPopup) === 'undefined') return {};
                return MVCxClientPopupControl.GetControlCollection().GetByName(userPopup) || {};
            }
            this.popup = _getControl();
            try {
                this._height = this.popup.GetHeight ? this.popup.GetHeight() : null;
                this._controlHeight = CurrentGlobal.GetHeight();
            } catch (e) { }
            this.onAfterResize = function (trigger) {
                if (!this.popup || !this._height)
                    return;
                this.popup.SetHeight(this._height);
                CurrentGlobal.SetHeight(this._controlHeight);
                trigger && $(window).trigger('resize');
            };
        })();
    switch (position) {
        case 'none':
            splitterPosition = 'none';
            var item = panel.find('.opt-item:eq(0)');
            item.addClass('checkedItem');
            if (tree)
                left.jqxSplitter({ width: "100%", showSplitBar: false, height: "100%", orientation: 'horizontal', panels: [{ size: "100%" }] });
            else
                right.jqxSplitter({ width: "100%", showSplitBar: false, height: "100%", orientation: 'horizontal', panels: [{ size: "100%" }] });
            container.empty().hide();
            break;
        case 'down':
            splitterPosition = 'horizontal';
            var item = panel.find('.opt-item:eq(1)');
            item.addClass('checkedItem');
            if (!right.find('.properties-panel').length)
                right.append("<div class='properties-panel'></div>");
            right.jqxSplitter({ width: "100%", height: "100%", showSplitBar: true, orientation: 'horizontal', panels: [{ size: "50%" }, { size: "50%" }] });
            afterResizeHelper.onAfterResize(true);
            break;
        case 'right':
            splitterPosition = 'vertical';
            var item = panel.find('.opt-item:eq(2)');
            item.addClass('checkedItem');
            if (!right.find('.properties-panel').length)
                right.append("<div class='properties-panel'></div>");

            right.jqxSplitter({ width: "100%", height: "100%", showSplitBar: true, orientation: 'vertical', panels: [{ size: "50%" }, { size: "50%" }] });
            afterResizeHelper.onAfterResize();
            break;
    }

    if (id) {
        var id = typeof CurrentGlobal == 'undefined' ? null : CurrentGlobal.GetSelectedKey();
        if (!tree && !CurrentGrid.GetVisibleRowsOnPage()) // не загружаем данные в панель при пустом списке
            id = -1;
        container.append(_loader);
        ax.post(ax.links.panelDialog, {
            showIndicator: false,
            ReferenceId: id || null,
            objectId: id,
            position: position,
            saveInCache: saveInCache,
            popupChild: !!container.parents('.DynamicDialogContainer').length
        }, function (data) {
            if (!CurrentGlobal) InitilizeGrid(container);
            CurrentGlobal.OnPanelStateReady(data, container);
            container.remove('.loaded_pane');

        });
    }

    container.show();
    initGrid();
}

function ShowPropSelection(ctrl, id) {
    InitilizeGrid(ctrl);
    if (ctrl && ctrl.parents('.ManyTableHeader').length) {
        var table = ctrl.parents('.ToManyLinkedTable');
        table.find('.LinkedRowLine').each(function () {
            var check = $(this).find('.customcheckbox').prop('checked');
            if (check)
                $(this).find('.LinkedTableRow').trigger('dblclick');
        });
    }
    else
        OpenNewPopup(CurrentGlobal.GetSelectedKey(), CurrentGlobal.GetReferenceData())
}

function EditDialog(ctrl, onlyButtons) {
    if (!ctrl.parents('.disablededit').length && !ctrl.hasClass('EditDialogButton'))
        return false;

    var objectData = ctrl.parents('.InvisibleContainer').first().data('object-data');
    var InPanel = !!ctrl.parents('.properties-panel').length;/// ? true : false;
    var ParentId = CurrentGlobal ? CurrentGlobal.GetParentId() : null;
    if (!onlyButtons) {
        ax.post(ax.links.CheckOutObjects, {
            ReferenceId: objectData.referenceId,
            Container: objectData.id,
            ParentId: ParentId,
            InPanel: InPanel,
            actual: true
        }, function (data) {
            ctrl.hide();
            EditButtons(ctrl);
            //  ctrl.parents('.disablededit').first().removeClass('disablededit');
        });
    } else {
        ctrl.hide();
        EditButtons(ctrl);
    }
    //  load.hide();
    dialogHelper.OnResize();
}

function ShowCustomTab(text, ctrl) {
    var TableSelector = $.trim(text);
    var parentCtrl = ctrl.parent(".ControlTabs");
    parentCtrl.find(".TabControl").each(function () {
        $(this).removeClass('active-tab');
    });
    var TableCtrl;
    ctrl.addClass('active-tab');
    parentCtrl.parent(".GroupColumn").find(".CustomTabTable").each(function () {
        $(this).css({ "display": "none" });
        var id = $(this).attr("Id");
        if (id == TableSelector) {
            $(this).css({ "display": "table" });

            TableCtrl = $(this);
        }
    });
    TableCtrl.each(function () {
        $(this).find(".GroupColumn").each(function () {
            $(this).find(".CustomTabTable:first").css({ "display": "table" });
            $(this).find(".TabControl:first").addClass('active-tab');

        });
    });
    initGrid();
    //   ctrl.parents('.WebDialogContent').first().find('.ObjectParameters').trigger('resize');
}

function ShowGroupPages(GroupId, ctrl) {
    var content = ctrl.parents('.WebDialogContent').first();
    content.find(".GroupContainer").css({ "display": "none" });
    content.find("._table_container").css({ "display": "none" });
    content.find("#" + GroupId).css({ "display": "inline" });
    content.find("#" + GroupId).find("._table_container:first").css({ "display": "block" });
    content.find("#" + GroupId).find("li:first").trigger('click');
    content.find(".groupName").removeClass("SelectedDialogGroup");
    ctrl.addClass("SelectedDialogGroup")
    if (TabsIsHidden) ShowFirstTab();
}

function ShowPageControls(PageId, GroupId, Linked, ctrl) {
    var content = ctrl.parents('.GroupContainer').first();
    content.find("._table_container").css({ "display": "none" });
    content.find(".PageControl").removeClass("Selected-Dialog-Page");
    ctrl.addClass("Selected-Dialog-Page");
    var page = content.find("#" + PageId);
    if (page.length) {

        page.css({ "display": "block" });
        //    $(window).trigger('resize');

    }
    else {
        content.append(_loader);
        var data = {
            id: PageId, groupId: GroupId, linked: Linked == "True",
            showIndicator: false, ids: [], folderId: 0
        }, url = "/WebDialog/";
        if (ctrl.parents('.mail.m-item').length || ctrl.parents('.DesktopContainer').length) {
            InitilizeGrid(ctrl); url = "/Desktop/";
            if (typeof CurrentGrid === 'undefined'
                || CurrentGrid.cpWinType == "Mail"
                || CurrentGrid.cpWinType == "Tasks") {
                var parents = ctrl.parents('.main-m');
                parents.each(function (num, i) {
                    data.ids.push($(this).data('item-id'));
                    if (num === parents.length - 1) {
                        data.folderId = $(this).data('folder-id');
                        data.masterId = $(this).data('item-id');
                    }
                });
                if (data.ids.length > 1) {
                    data.ids.pop();
                    data.ids.reverse();
                }
                data.guid = null; data.type = data.folderId ? "Mail" : "Tasks";
                data.attachment = parents.first().find('.att-item.active-att').data('name');
            }
            else {
                data.guid = CurrentGrid.GetSelectedKeysOnPage()[0] || null;
                data.type = CurrentGrid.cpWinType;
            }
        }
        InitilizeGrid(ctrl);
        if (ctrl.parents('.TableContainerColumn').length) {
            data.selectedChild = CurrentGlobal.GetSelectedKey();
        }
        ax.post(url + 'GetPage/', data, function (data) {
            content.find('.loaded_pane').remove();
            content.append(data.Text);
            dialogHelper.initControls(content.find('._table_container:visible'));
            content.parents('.InvisibleContainer').first()[0].SetScroll();
            //  dialogHelper.OnResize();
            //  $(window).trigger('resize');
        });
    }
}

function EditButtons(ctrl) {
    var Parent = ctrl.parents('.InvisibleContainer').first();
    Parent.removeClass('disablededit');
    Parent.find(".EditDialogButton:first").hide();
    Parent.find('.customDialog-button').each(function () {
        $(this).removeClass("Disabled-Button");
        $(this).fadeIn('fast');
    });
    Parent.find('.LinkedTextBox, .dx_docs_area textarea, .ChangeToOneLink ').each(function () {
        $(this).attr("disabled", false);
    });
    Parent.find('.DialogTextBox').each(function () {
        var IsClosed = $(this).attr("IsClosed");
        if (IsClosed === "False") { $(this).attr("disabled", false); }
    });
    Parent.find('.Add-image-button').each(function () {
        $(this).removeClass('dsbld');
    });
    Parent.find('.dx-editor').each(function () {
        var IsClosed = $(this).attr("IsClosed");
        if (IsClosed === "False") { $(this).removeClass('disablededit'); }

    });
    Parent.find('.tlbr-ctrl').each(function () {
        var parent = $(this).parents('td').first();
        parent.addClass('fxd-col');
        $(this).removeClass('tlbr-ctrl');
    });
    Parent.find(".ChangeButton").css({ "display": "inline-block" });
    Parent.find(".SaveDialogChangesButton").css({ "display": "inline-block" });
    Parent.find(".CancelDialogChangesButton").css({ "display": "inline-block" });
    var frame = ctrl.parents('.InvisibleContainer').first().find('.cad_frame');
    if (frame.length && frame[0].contentWindow && frame.attr('src')) {
        var documentEditor = frame[0].contentWindow.documentEditor;
        documentEditor && documentEditor.PerformCallback();
    }
}

function ChooseFolder(c) {
    var key = EncodeKey(eval(c.parents('.m_diag').first().find('.TreelistDynamic:first').attr('id')).GetFocusedNodeKey()),
        target = importPoint.parents('form').first();
    target.attr('action', target.data('url'));
    var url = target.attr('action') + '&FolderId=' + key;
    target.attr('action', url);
    c.next().trigger('click');
    InitilizeGrid(target);
}

function InitDiag(ctrl) {
}

function ShowColumnsSettings(ctrl, RefId, IsDesktop, WindowType) {
    InitilizeGrid(ctrl);
    if (IsDesktop) {
        if (WindowType === "Mail") {
            if (!ismail)
                WindowType = "Tasks";
        }
    }
    ax.post('/DisplayView/GetGridColumnsSettings/', { ReferenceId: RefId, IsDesktop: IsDesktop, WindowType: WindowType }, function (data) {
        AddDialog(data.Text);
    });
}

function SaveColumnWidth(s, e) {
    InitilizeGrid($(s.mainElement));
    var helper = s.GetResizingHelper();
    $('.dx_gridview_table').each(function () {
        if ($(this).is(':visible')) {
            var parentwidth = $(this).width(), percent = (parentwidth / 100), container = [],
                except = [0]; if (s.cpCheckBoxVisivle == false) except = []; //if (s.cpWinType == 'Desktop') except.push(2);
            $(this).find('.dx_gridview_header').each(function () {
                // Не считаем статические размеры чекбокса и иконки
                if (except.indexOf(this.cellIndex) == -1) {
                    var index = s.GetColumnIndexByHeaderCell(this)// s.cpWinType ? this.cellIndex : this.cellIndex + 1
                    var col = s.GetColumn(index), info = helper.GetColumnInfo(index);
                    if (col && col.name != "icon_col") {
                        var thisWidth = Math.round($(info.headerCell).width() / percent);
                        var setted = (col.name === 'status_col') ? "30px" : thisWidth + "%";
                        container.push(thisWidth);
                    }
                }
            });
            ax.post('/DisplayView/SaveGridWidth/', { showIndicator: false, container: container });
        }
    });
    initGrid();
}

/*
 *   var table = $(s.GetMainTable()),
           parentwidth = table.width(), percent = (parentwidth / 100), container = [],
           helper = CurrentGrid.GetResizingHelper(); var index = s.cpWinType ? 2 : 3;
           for (var i = index; i < CurrentGrid.GetColumnsCount() ; i++) {
               var col = helper.GetColumnInfo(i);
               if (col && col.headerCell) {
                   var p = $(col.headerCell).width() / percent;
                   container.push(p);
                   helper.ApplyColumnWidth(i, p + "%");
               }
           }
           ax.post('/DisplayView/SaveGridWidth/', { showIndicator: false, container: container }, function () {
               helper.ApplyColumnWidth(0, "30px");
               helper.ApplyColumnWidth(index - 1, "30px");
           });
           // initGrid();
 */
function UploadObjectImage(formId) {
    $("#" + formId).submit();
}

function UploadObjectImage_Complete(formId) {
    return false;
}

function On_import_Completed(event) {
    if (typeof Indicator != 'undefined')
        Indicator.hide();

    //  document.getElementById("ImgForm").reset();
    var content = $("#UploadTarget").contents().find("#jsonResult");;
    if (!content.length) {
        if ($('._upload_form').each(function () {
            if ($(this).data('loaded')) {
                CurrentGlobal.PerformCallback();
            }
        }));
        return;
    }

    var newImg = $.parseJSON(content[0].innerHTML);

    if (newImg.IsValid == false) {
        ShowError(newImg.Message);
        Indicator.hide();
        return;
    }
    alert(_localMessages.uploadComplete);
    Reload.Grid();
}


function initHeight() {
    //%TODO
}

function setGridWidth() {

    $('.Grid-Control-Class2').each(function () {
        var width = $(this).parents('.grid-control').first().width();
        var parent = $(this).find('.dxgvHSDC:first');
        var point = parent.next();
        //parent.css({ "width": width });
        point.css({ "width": width });

    });
}

function ResizeTreeView() {
    var width = $('#CatalogTreeList').width();
    var row = width + ' !important';
    $('.catalog-mid-container').css({ "width": row });
    $('.dxtlHSDC').css({ "width": width });
    $('.dxtlHSDC').next().css({ "width": row });
}


function Favouriteclick(ctrl) {
    var pathArray = window.location.pathname;
    if (ctrl.hasClass("passive-favourite")) {
        var name = document.getElementsByTagName("title")[0].innerHTML;
        ax.post("/Favourites/AddToFavourite/", { url: pathArray, name: name }, function (data) {
            ctrl.removeClass('passive-favourite');
            ctrl.find('img').attr("src", "/Content/Images/star_yellow_delete.ico");
            ctrl.attr('data-hint', _localMessages.marks.remove);
        });
    }
    else {
        ctrl.addClass('passive-favourite');
        ctrl.find('img').attr("src", "/Content/Images/star_yellow_add.ico");
        ctrl.attr('data-hint', _localMessages.marks.remove.add);
        ax.post("/Favourites/DeleteFromFavourite/", { url: pathArray });
    }
}


function ShowFrame(ctrl) {
    if (ctrl.data('type'))
        return;
    $('.hyper-link').removeClass('active-link');
    ctrl.addClass('active-link');;
    $('.Reference-row a').removeClass('active-link');
    $('#Frame-Container').fadeIn('fast');
}


function OpenMailItem(Globalid, FolderId, isMail, treepanel, gridview, ctrl) {
    try {
        ctrl.parents('tr').first().find('td').removeClass('bld-row');
        ReadMessage(ctrl, Globalid);
    }
    catch (er) {
        console.log(er);
    }
}

function ChangeDispView(opt, isDesktop) {
    var guid = opt.data('id'),
        context = opt.data('context');
    InitilizeGrid(opt);
    isDesktopView = isDesktop;
    if (guid == "new") {
        ViewName.SetValue("");
        ToFolder.SetValue(false);
        ViewCreationDialog.Show();
    }
    else {
        CurrentGlobal.SetCallBackArguments('AllowChangeCatalog', false);
        var inSession = !!CurrentGlobal.cpControlName;
        ax.post("/DisplayView/ChangeDisplayView/", {
            guid: guid, containerKey: context,
            IsDesktop: isDesktop, inSession: inSession
        }, function (data) {
            if (inSession)
                CurrentGlobal.SetCallBackArguments("OnWorkingPage", true);
            CurrentGlobal.PerformCallback();
        });
    }
}



function DeleteDisplayView(ViewName, RefId, isDesktop, id) {
    if (confirm(_localMessages.removeView + ' ' + ViewName + '?')) {
        ax.post("/DisplayView/DeleteDisplayView/", { containerKey: RefId, guid: id, IsDesktop: isDesktop }, function (a) {
            CurrentGlobal.PerformCallback();
        })
    }
}

function SplitterEvents(recoursive) {
    $('.nav-spl').on('click', function (e) {
        var nav = get_cookie("show-navigation");
        var width = $('#CatalogueContainer').width();
        if (!width == 0) {
            ;
            set_cookie("show-navigation", "true", 2025, 12, 15);

        }
        else {
            if (nav == "false") {
                set_cookie("show-navigation", "true", 2025, 12, 15);
                if (!recoursive && e.originalEvent !== undefined) {
                    $('#Main-Content').jqxSplitter({ width: "100%", height: "100%", panels: [{ size: "15%", min: 0 }, { min: 0, size: "85%" }] });
                    $('.jqx-splitter-collapse-button-vertical:first').addClass('nav-spl');
                    $('.jqx-splitter-splitbar-vertical:first').addClass('nav-cst-spl');
                    SplitterEvents(true);
                }
            }
            else {
                set_cookie("show-navigation", "false", 2025, 12, 15);
            }
        }
    });
}


function CheckBrowserVersion() {
    if (navigator.userAgent.match(/firefox/i)) { //Mozilla
        // $(".GroupColumn").css({ "padding-bottom": "30px" });
    }
    if (navigator.userAgent.match(/msie/i) || navigator.userAgent.match(/trident/i)) { //IE
        $('.global-panel').css({ "padding-bottom": "30px" });
        $(".customcheck").css({ "margin-left": "6px;" });
        $(".ObjectParameters").removeClass('height');
        $('.DialogTable').addClass('custom-padding');
        $('.GroupContainer').addClass('custom-container');
        $(".ObjectParameters").addClass('ie-custom');
        $('.CustomGroup').css({ "height": "" });
        setTimeout(function () {
            $(".ObjectParameters").removeClass('ie-custom');;
        }, 1);
    }
}


function FixIEStyle() {
    if ($.browser.mozilla) {
        $('.GroupColumn').each(function () {
            $(this).css({ "vertical-align": "top !important;" })
        });

        $('.TreelistDynamic').each(function () {
            var point = $(this).find('.dxAC');
            point.css({ "padding-bottom": "46px" });
        });
        $('.fixed-height-div').each(function () {
            var height = $(this).parents('.grid-control').first().height() - 80;
            if ($(this).parents('.Desktopcontainer').length) {
                $('.Desktopcontainer .dxgvHSDC').attr("style", "padding-top: 0px !important");
                $(this).parents('.dxgvHSDC').first().css({ "padding-top": "0px !important" });
                height = height + 25;
            }
            // var nw = height.toString() + "px";
            // $(this).attr('style', 'height:' + nw + ' !important');
        });
        $('.Desktopcontainer .dxgvHSDC').css({ "margin-top": "0px !important;" });
        $('.Desktopcontainer .grid-control').each(function () {

            $(this).attr("style", "padding-top:0px !important");
        });


    }
    // if (navigator.userAgent.match(/msie/i) || navigator.userAgent.match(/trident/i)) {
    if ($.browser.msie) {
        $('.CustomGroup').each(function () {
            $(this).css({ "height": "inherit !important" });
            $(this).addClass('hhre');
        })
        $('.repaired-height').each(function () {
            //    if ($(this).is(':visible')) {
            var parent = $(this).parents('.left-side-splitter').first();
            var height = parent.height() - 90;
            var result = height + "% !important";
            $(this).removeClass('ie-height');
            $(this).css({ "height": height });
            //   }
            $('.fixed-height-div').each(function () {
                $(this).removeClass('ie-height');
                var parent = $(this).parents('.grid-control').first().height() - 54;
                $(this).css({ "height": parent });

            });
        });
    }
}


function CheckNavigationCookies() {
    var ShowNav = get_cookie("show-navigation");
    if (ShowNav == "false") { $('#CollapseImg').trigger('click'); }
}

function ClearIFrame() {
    $('#Frame-Container').attr('src', "");
    $('#Frame-Container').hide();
}




function Tabclk(text, ctrl, index) {
    var parent = ctrl.parents('.GroupColumn').first();
    parent.find('.page-cust-column').each(function () { $(this).hide(); });
    var tab = parent.find('.page-cust-column:eq(' + index + '):first');
    tab.css({ "display": "table" });
    $(window).trigger('resize');
    parent.find('.TabControl').each(function () { $(this).removeClass('active-tab'); });
    ctrl.addClass('active-tab');
    $('.Grid-Control-Class2').each(function () {
        var grid = eval($(this).attr("id")),
            height = $(this).parents('.grid-control').first().height() - 90,
            p = $(this).find('.dxgvCSD:first');
        if (!grid) return;
        p.height(height);
        grid.SetWidth(800);
    });
}

function SetControlSize() {
    $('.TreelistDynamic').each(function () {
        var point = $(this).find('.dxtlHSDC:first');
        var cur = point.next();
        cur.addClass('repaired-height');
        cur.addClass('ie-height');
    });

}

//������ ������ �����������
function CheckDirectory() {
    if ($('#left-column').attr("show") == "False") {
        $(".jqx-fill-state-pressed:first").trigger("click");
    }
}

function RepairGrid(ctrl) {
    var par = ctrl.parents('li').first().find('.view-config-menu:first');
    if (ctrl.hasClass('Selected-Command')) {
        ctrl.removeClass('Selected-Command');
        par.fadeOut('fast');
        return;
    }
    ctrl.addClass('Selected-Command');

    par.fadeIn("fast");
}




function DesktopNodeClick(grid, e) {
    CurrentGrid = eval(grid);
    ax.post('/RecycleBin/RecycleBinTable', { showIndicator: false, ReferenceId: e.nodeKey }, function () { Reload.Grid(); });
    var panel = $('.global-panel[id=' + CurrentGlobal.name + ']').first(),
        pane = panel.find('.properties-panel:visible');
    if (pane)
        pane.empty();
}





function CreateDisplayView() {
    var name = ViewName.GetText(),
        desktop = !!CurrentGlobal.cpWinType;
    id = desktop ? CurrentGlobal.cpWinType : CurrentGlobal.GetReferenceData().ReferenceId;
    ax.post("/DisplayView/CreateDisplayView/",
        {
            viewName: name, containerKey: id, isDesktop: isDesktopView, toFolder: ToFolder.GetChecked(),
            shared: IsShared.GetChecked ? IsShared.GetChecked() : false
        },
        function () {
            ViewCreationDialog.Hide(); CurrentGlobal.PerformCallback();
        })
}

function PageProperty(id, tree, tab) {
    var forTree = tree || CurrentGlobal.GetViewMode() === "Tree";
    if (CurrentTree && CurrentTree.cpGanttTree) { forTree = tab = true; }
    ax.post("/DisplayView/GetViewSettings/", { forTree: forTree, columnsTab: tab }, function (data) {
        AddDialog(data.Text);
    });
}

function SubmitViewForm(control, context, tree) {
    CurrentGlobal = (pcViewSettings.cpCachePanel || CurrentGlobal);
    if (!$("#viewForm").length) {
        $(okay_cols_button.mainElement).trigger('click');
        return;
    }
    $("body").css("cursor", "wait");
    var uploadTimer = typeof UseReloadControlTimer != 'undefined',
        data = JSON.parse($("#viewForm input[name='DXMVCEditorsValues']:first").val()),
        reloadTimer = (uploadTimer && UseReloadControlTimer.GetValue()) ? ReloadControlTimer.GetValue() : null;
    ax.post("/DisplayView/SetSettings", {
        showIndicator: false, styles: data, context: context, reloadTimer: reloadTimer,
        forTree: (tree === 'True' || CurrentGlobal.GetViewMode() === "Tree")
    }, function () {
        if (typeof (okay_cols_button) != 'undefined')
            $(okay_cols_button.mainElement).trigger('click');
        CloseDialog($(control.mainElement));
        //   var item = CurrentGlobal.cpGanttTree ? CurrentGlobal : (tree === 'False' ? CurrentGrid : CurrentTree);
        //if (typeof (DoubleClickAction) != 'undefined' && DoubleClickAction.IsValueChanged()) item = CurrentGlobal;
        CurrentGlobal.PerformCallback();
        uploadTimer && CurrentGlobal.StartReloadTime(reloadTimer);
    });
    $("body").css("cursor", "default");
}
function onPopupClose(s, e) {
    CloseDialog($(s.windowElements[-1]));
}

function ShowManagerControl(ctrl, RefId) {
    InitilizeGrid(ctrl);
    ax.post('/Catalogues/GetTreeColumnsSettings/', { ReferenceId: RefId }, function (data) {
        AddDialog(data.Text);
    });
}

var signatures = new (function () {
    this._postData = {};
    this._defaultPost = function (method, selectSign, afterCallBack) {
        if (selectSign) {
            this._postData.signId = parseInt(gvSignatures.GetSelectedKeysOnPage()[0] || 0);
            delete this._postData.model;
        }
        ax.post("/Signatures/" + method, this._postData, function (data) {
            afterCallBack && afterCallBack();
            data.Text && AddDialog(data.Text);
        });
    };
    this.Init = function (referenceId, objId) {
        this._postData = {
            ReferenceId: referenceId,
            id: objId
        }
    };
    this.Get = function (afterCallback) {
        this._defaultPost("Get", null, afterCallback);
    };
    this.GetSignForm = function () {
        this._defaultPost("GetSignForm", true);
    };
    this.Sign = function (s, e) {
        // Коллируется devexpress-ом
        var newData = signatures.GetFormData("signSetForm");
        ax.post("/Signatures/Sign/", newData, function (data) {
            gvSignatures.PerformCallback();
            CloseDialog($(s.mainElement));
        });
    };
    this.Add = function () {
        this._defaultPost("Add");
    };
    this.Edit = function () {
        this._defaultPost("Edit", true);
    };
    this.Save = function (id, s) {
        var newData = this.GetFormData("signForm");
        newData.model.Id = id;
        ax.post("/Signatures/Save/", newData, function (data) {
            CloseDialog($(s.mainElement));
            gvSignatures.PerformCallback();
        });
    };
    this.GetUsers = function () {
        this._defaultPost("GetUsers", true);
    };
    this.Delete = function (s, e) {
        this._defaultPost("Delete", true, function () {
            gvSignatures.PerformCallback();
        });
    };
    this.SetUser = function (s, e) {
        // Коллируется devexpress-ом
        var key = CurrentGlobal.GetSelectedKey();
        ax.post("/Signatures/GetUser/", { id: key }, function (data) {
            UserId.SetText(data.Text);
            UserId['cpId'] = key;
        });
        CloseDialog($(s.mainElement));
    };
    this.GetFormData = function (form) {
        var array = $('#' + form).serializeArray(),
            elem = array.filter(function (x) {
                return x.name === "DXMVCEditorsValues";
            })[0];
        data = JSON.parse(elem.value);
        if (typeof UserId !== "undefined")
            data.UserId = UserId['cpId'];
        data.Id = parseInt(gvSignatures.GetSelectedKeysOnPage()[0] || 0);
        delete this._postData.signId;
        var newData = this._postData;
        newData.model = data;
        return newData
    };
})();

function SaveColSettings(s, e) {
    var data = valueHelper.GetFormData('column_form');
    ax.post('/DisplayView/SaveColumnSettings', { showIndicator: false, settings: data }, function (data) {
        CurrentGrid.PerformCallback();
        CloseDialog($(s.mainElement));
    });
}

function UploadMailAttachment(obj) {
    $('#attachment_line').fadeIn("slow");
    var point = $('#attachment_line .attachments-container:first');
    for (var i = 0; i < obj.Icons.length; i++) {
        var row = '<div class="_att_item" ><img  src='
            + obj.Icons[i] + ' /><span title=' + _localMessages.remove + '>'
            + obj.Names[i] + '</span><i></i></div>';

        point.append(row);
    }
}



function PropPanelDesktop(winType, ctrl, position) {
    InitilizeGrid(ctrl);
    var panel = ctrl.parents('.global-panel').first();
    var container = panel.find('.properties-panel:first');
    var right = panel.find('.horizontal-split:first');
    var left = panel.find('.treelist-control:first');
    var container4 = panel.find('.view-config-menu:first');
    $('.hint--top').removeClass('Selected-Command');
    container4.hide();
    container.empty();
    var key = CurrentGrid.GetSelectedKeysOnPage()[0];
    var items = container4.find('.opt-item');
    items.each(function () {
        $(this).removeClass('checkedItem');
    });
    var item = {};
    if (!right.find('.properties-panel').length) {
        container = $("<div class='properties-panel'></div>");
        right.append(container);
        right.find('.jqx-fill-state-normal').remove();
    }
    right.jqxSplitter('refresh');
    switch (position) {
        case 'none':
            splitterPosition = 'none';
            item = panel.find('.opt-item:eq(0)');
            item.addClass('checkedItem');
            right.jqxSplitter({ width: "100%", height: "100%", orientation: 'horizontal', panels: [{ size: "100%" }] });
            container.empty();
            container.hide();
            break;
        case 'down':
            splitterPosition = 'horizontal';
            item = panel.find('.opt-item:eq(1)');
            item.addClass('checkedItem');
            right.jqxSplitter({ width: "100%", height: "100%", orientation: 'horizontal', panels: [{ size: "50%" }, { size: "50%" }] });
            container.show();
            break;
        case 'right':
            splitterPosition = 'vertical';
            item = panel.find('.opt-item:eq(2)');
            item.addClass('checkedItem');
            right.jqxSplitter({ width: "100%", height: "100%", orientation: 'vertical', panels: [{ size: "50%" }, { size: "50%" }] });
            container.show();
            break;
    }
    if (!CurrentGlobal.ShowPanel())
        return;
    container.append(_loader);
    ax.post('/Desktop/GetWindowProperties/', { showIndicator: false, type: winType, ReturnDialog: true, position: position, containerKey: key, IsMail: ismail }, function (data) {
        CurrentGlobal.OnPanelStateReady({ Data: { content: data.Text } }, container);
    });
    initGrid();
}

var mailService = {
    createCard: function (name, id, type, icon) {
        var div = $("<div></div>", { 'class': 'adr-item', 'data-source-id': id, 'data-id': id, 'type': type, 'key': id, 'text': name }),
            ul = $("<ul></ul>", { 'class': 'alt-menu', 'style': 'display:none' }),
            li1 = $("<li></li>", { 'data-type': 'card', 'text': _localMessages.mailMenu.card }),
            li2 = $("<li></li>", { 'data-type': 'internal', 'text': _localMessages.mailMenu.useInternal, 'class': type === 'InetUser' ? '' : 'checked_option' }),
            li3 = $("<li></li>", { 'data-type': 'Email', 'text': _localMessages.mailMenu.useEmail, 'class': type !== 'InetUser' ? '' : 'checked_option' }),
            del = $("<img />", { 'title': 'Удалить', 'onclick': 'DelAdrItem($(this))', 'src': '/Content/Images/Mail/adr-close.png', 'class': 'cl-a-i' });
        ul.append(li1, li2, li3); div.append(ul, del);
        if (icon)
            div.prepend(icon);
        return div;
    },
    addContact: function (event, menu) {
        var point = $(event.target),
            parent = point.parents('div').first(),
            icon = point.find('img') || null;
        parent.find('textarea:first').before(mailService.createCard(point.text(), point.data('id'), 'user', icon));
        parent.find('.mail_dropdown_list').hide();
        parent.find('.contact-area').val('');
    },
    decrementRead: function (task) {
        var $unreaded = $('#mail_unreaded'),
            count = $unreaded.data('count'); count--;
        $unreaded.text("(" + count + ")").data('count', count);
    },
    SetMailUnread: function (info) {
        var sum = info.tasks + info.messages;
        var $unreaded = $('#mail_unreaded');
        $unreaded.text("(" + sum + ")").data('count', sum);
        var msgPoint = $('.unread_point:first'), taskPoint = $('.unread_point_tasks:first');
        if (msgPoint.length) {
            msgPoint.text('(' + info.messages + ')').attr('data-count', info.messages).data('count', info.messages);
            taskPoint.text('(' + info.tasks + ')').attr('data-count', info.tasks).data('count', info.tasks);
        }
    },
    notify: function (info) {
        var $elem = $("<div></div>", { 'id': 'new_mail_notifier', 'data-id': info.globalId, 'data-mail': info.isMail, 'data-folderid': info.folderId}),
            $inner = $("<div></div>", { 'id': 'new_mail_notify_info' });
        $elem.prepend('<i>закрыть</i>'); //%TODO
        $inner.append('<img src=' + info.iconUrl + ' /><span>' + info.to + '</span>')
        $inner.append('<span>' + info.subject + '</span>');
        $inner.append("<div style='text-align:center'><button>Открыть сообщение</button></div>");
        $elem.append($inner);
        if ($('#new_mail_notifier').length)
            return;
        $('body').append($elem);
        $elem.animate({
            opacity: 1,
        }, 1500);

      //  setTimeout(function () { $elem.fadeOut(700, function () { $elem.remove() }) }, 7000);
    }
}
var TreeViewKey = null;
var AccountGuid = null;

function SetTo(ctrl, gridview, IsCopy) {
    var parent = ctrl.parents('.adr-book-c:first'),
        grid = eval(gridview),
        keys = grid.GetSelectedKeysOnPage();
    var point = !IsCopy ? parent.find('.adr-area:eq(0)') : parent.find('.adr-area:eq(1)')
    var table = $(grid.mainElement);
    for (var i = 0; i <= keys.length - 1; i = i + 1) {
        var value = table.find('.book_row[data-id=' + keys[i] + '] .nameField:first');
        var Type = "Contact",
            img = value.prev().find('img:first').clone();
        if (grid.nodeKey)
            Type = "User";
        var card = mailService.createCard(value.text(), keys[i], Type, img);
        point.prepend(card);
    }
}

function SetMsgAttach(ctrl, Attachtreeview, gridview) {
    var IsTask = !ismail,
        FolderId = null,
        node = Attachtreeview.GetSelectedNode(),
        keys = gridview.GetSelectedKeysOnPage(),
        AsText = uploadRadionBtns.GetValue() === "Text";
    if (node != null) {
        if (node.target == null || node.target == "") { IsTask = true; }
        FolderId = Attachtreeview.GetSelectedNode().name;
    }
    ax.post('/Mail/UploadMailItem/', { FolderId: FolderId, keys: keys, IsTask: IsTask, AsText: AsText }, function (data) {
        var src = "/Content/Images/Mail/Tasks/Task.ico", items = data.items
        if (!IsTask) { src = "/Content/Images/Mail/Mail.ico" }
        if (!AsText) {
            if (items != null && items.length > 0) { mailPoint.parents('tr').first().fadeIn('fast'); }
            for (var i = 0; i <= items.length - 1; i++) {
                var name = items[i] == "" ? _localMessages.noName : items[i];
                SetAttachmentRow(mailPoint, src, name);
            }
        }
        else {
            var content = data.body,
                item = mailPoint.parents('.main-m').first(),
                frame = item.find('.ext-col iframe:first'),
                conts = frame.contents(),
                bd = conts.find("body");
            bd.append(content);
        }
        CloseDialog(ctrl);
    });
}
function ExecuteTaskCom(ctrl, id, type, solutionGuids) {
    var parent = ctrl.parents('.m_item_box').first(),
        img = ctrl.find('img:first'),
        gridId = parent.find('.Executors:first').find('.Grid-Control-Class2:first').attr("id"),
        grid = eval(gridId),
        box = $('.draggable_task'),
        panel_id = ctrl.parents('.Main-panel').first().attr("id"),
        panel = eval(panel_id);
    if (type === 'Replan') {
        ax.post('/Mail/Replain', { TaskId: id }, function (data) {
            CloseDialog(ctrl);
            AddDialog(data.Text);
        });
        return;
    }
    var solutionsDialog = typeof (ChosingTaskSolution) === "undefined" ? null : ChosingTaskSolution,
        supportComments = ['Complete', 'AsSolution', 'Reject', 'Ignore'],
        hasGuids = !!((solutionGuids || []).length),
        question = ctrl.data('question');
    if (type === "Retry" && !confirm(question))
        return;
    var showComment = $.inArray(type, supportComments) > -1 && !box.is(":visible") && typeof (pcTaskAcceptBox) == 'undefined',
        hasUserDialogs = ((typeof (pcTaskAcceptBox) === 'undefined' || !(!!pcTaskAcceptBox.mainElement)) && parent.data('has-dialogs'));
    if (showComment && (hasUserDialogs || !!solutionsDialog)) {
        if ((type == 'Complete' || type == 'Ignore') && solutionsDialog && solutionsDialog.cpExceptionTable && !hasGuids) {
            expandSolMenu();
            return;
        }

        CurrentCommand = ctrl;

        if (parent.data('show-accept-form') === true) {
            ax.post('/Mail/GetAcceptForm', { id: id }, function (data) {
                AddDialog(data.Text);
            });
            return;
        }
        else {
            if (typeof (dx_task_acceptText) != 'undefined')
                dx_task_acceptText.SetText('');
            box.show();
            box.attr('type', type);
        }
        CurrentCommand = ctrl;
    }
    else {
        CurrentCommand = null;
        var hasDialogData = typeof dx_task_acceptText != 'undefined';
        box.hide(); var objects = hasDialogData ? dx_task_acceptText.cpObjects : null;
        if (objects && objects.length) objects = JSON.parse(objects);
        var variableData = hasDialogData ? dx_task_acceptText.cpVariableData : null;
        ax.post('/Mail/ExecuteTaskCom/', {
            id: id, type: type, comment: TaskComment, solutionGuids: solutionGuids,
            objects: objects, variableData: variableData
        }, function (resp) {
            if (resp.data && confirm(resp.data.message))
                ax.post('/ProjectManagement/ChangeElementState/', { ids: [resp.data.id], state: resp.data.state });
            panel.PerformCallback();
            eval($('.Desktopcontainer .Grid-Control-Class2:first').attr('id')).PerformCallback();
        });
    }
}

function PopOutProperties(ctrl, table) {
    InitilizeGrid(ctrl);
    var url = '/ObjectProperties/' + table + '?rootId=' + CurrentKey;
    if (CurrentGlobal.cpLinkTable) {
        var data = CurrentGlobal.GetReferenceData();
        url += '&relation=' + data.RelationGuid + '&masterId=' + data.MasterObjectId;
    }
    window.open(url, table + CurrentKey.toString(),
        'toolbar=no,status=no,scrollbars=no,location=no,menubar=no,directories=no,width=500,height=300');
}

// Контейнер для работы с настройками вида в куках
var viewStorage = {
    _cookieKey: "view_settings",
    _container: {},
    _currentSettings: {},
    _load: function (context) {
        var cookie = get_cookie(this._cookieKey);
        this._container = cookie ? (JSON.parse(get_cookie(this._cookieKey) || [])) : [];
        if (context && $.isArray(this._container)) {
            this._currentSettings = this._container
                .filter(function (item) { return item.context == context })[0];
        }
        if (!this._currentSettings)
            this._currentSettings = {};
    },
    _save: function () {
        var context = this._currentSettings.context,
            container = this._container;
        if (container.length) {
            for (var i = container.length - 1; i >= 0; i--) {
                if (container[i].context == context)
                    container.splice(i, 1);
            }
        }
        container.push(this._currentSettings);
        //   document.cookie = this._cookieKey + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        set_cookie(this._cookieKey, JSON.stringify(container), 2020, 12, 15);
    },
    setFocusId: function (context, id) {
        this._load(context);
        if (!this._currentSettings.context)
            this._currentSettings.context = context;
        this._currentSettings.focusId = id;
        this._save();
    },
    getViewSettings: function (context) {
        this._load(context); return this._currentSettings;
    }
}


function TreeMoveUp(ctrl) {
    InitilizeGrid(ctrl);
    if (!CurrentGrid.cpRootPath)
        CurrentGrid.cpRootPath = CurrentTree.GetFocusedPath();
    CurrentGrid.cpRootPath.splice(CurrentGrid.cpRootPath.length - 1, 1);
    var parentId = CurrentGrid.cpRootPath[CurrentGrid.cpRootPath.length - 1];
    var parent = CurrentTree.GetFocusedParentRow();
    CurrentGrid.SetCallBackArguments("TreeFolderKey", parentId);
    CurrentGrid.SetCallBackArguments("RootObjectPath", CurrentGrid.cpRootPath);
    var onlyTree = CurrentGlobal.UseTreeState();
    !onlyTree && CurrentGrid.PerformCallback();
    if (parent.length) {
        nodeKey = CurrentTree.GetNodeKeyByRow(parent[0]);
        CurrentTree.SetFocusedNodeKey(nodeKey);
        var container = $(CurrentTree.mainElement).find('.dxtlCSD:eq(1)'),
            top = parent.position().top;
        if (top < 0 || top > container.height())
            container.scrollTop(top + container.scrollTop());
        if (CurrentGlobal.UseTreeState()) {
            parentId = nodeKey;
            TreeClick(CurrentTree, { htmlEvent: { target: parent[0] }, nodeKey: nodeKey }, CurrentGrid, CurrentTree);
        }
    }

    if (CurrentGlobal.UseTreeState() && !parentId)
        parentId = EncodeKey(nodeKey);

    CurrentGrid.TriggerObjectCommand(parentId, '_moveUp_folder');
}

function TokensChanged(s, e) {
    var value = JSON.parse("[" + e.value + "]");
    if (!s.listBox || !s.listBox.IsVisible()) {
        var deleteId = null;
        for (var i = 0; i < s.cpValues.length; i++) {
            if (!value.indexOf(s.cpValues[i]) != -1) {
                deleteId = s.cpValues[i];
                s.cpValues.remove(deleteId);
                ax.post(ax.links.removeLink, { ReferenceId: 0, container: [deleteId], guid: s.cpContainer.LinkGuid },
                    function (d) {

                    });
            }
        }
    }
    else {
        var value = s.GetCurrentValue(),
            model = s.cpContainer;
        model.Ids = [value];
        model.IsTokenBox = true;
        ax.post('/DialogChanges/AddToManyObjectRow/', { container: model }, function (data) {
            s.cpValues.push(value);
            console.log(data);
        });
    }
}

var columnsHelper = {
    GetCustomColumnForm: function (id, existed) {
        var column = VisibleColumns.GetSelectedItem(),
            name = (existed && column.texts[2] == 'UserColumnInfo') ? column.texts[0] : null
        ax.post('/DisplayView/GetCustomColumnForm/', { id: id, name: name }, function (data) {
            AddDialog(data.Text);
        });
    },
    SaveUserColumn: function (s, e) {
        var data = { Name: dx_name_input.GetValue() };
        ASPxClientRadioButton.GetControlCollection().ForEachControl(function (e) {
            if (e.isASPxClientRadioButton && e.cpType && e.GetChecked()) {
                data.Type = e.cpType; var control = eval($($(e.mainElement).nextAll()[1]).attr('id'));
                data.Context = control.cpValue || control.GetValue();
                data.Text = control.GetText();
                if (data.Type == "Macros") data.Context = JSON.stringify([data.Context, dx_methods_items.GetValue()]);
            }
        });
        if (!data.Context) { alert("Не задано значение"); return; }
        var selected = VisibleColumns.GetSelectedItem();
        if (dx_name_input.cpExisted) {
            VisibleColumns.RemoveItem(selected.index);
        }
        var colInfo = {
            "name": data.Name
        };
        colInfo.CalcType = data.Type;
        colInfo.StringData = data.Context;
        colInfo.Type = "UserColumn";
        colInfo.PathString = data.Context;
        ax.post('/DisplayView/SaveCustomColumn/',
            { userColumn: colInfo, oldName: dx_name_input.cpExisted ? selected.texts[0] : null },
            function () {
                VisibleColumns.AddItem([data.Name, data.Type, "$UserColumnItem", data.Text], data.Context, "/Content/Images/Commands/CustomColumn.ico");
                CloseDialog($(s.mainElement));
            });


    },
    DeleteCustomColumn: function (id, tree) {
        var column = VisibleColumns.GetSelectedItem();
        name = column.texts[0];
        ax.post('/DisplayView/DeleteCustomColumn/', { id: id, name: name, tree: tree }, function (data) {
            VisibleColumns.RemoveItem(column.index);
        });
    }
}
function SaveFileEdit(ctrl, key) {
    function goClose() {
        CloseDialog(ctrl);
        $('.Grid-Control-Class2').each(function () {
            if ($(this).attr('id').indexOf("FilesGrid") >= 0)
                InitilizeGrid($(this));
        });
        $('#draggable').data('keys', CurrentGlobal.GetSelectedKeys());
        SendCommentAndAccept("web");
    }
    var frame = ctrl.parents('.InvisibleContainer').first().find('iframe:first');
    if (!frame.length)
        return goClose();
    var documentEditor = frame[0].contentWindow.documentEditor;
    if (documentEditor && documentEditor.HasUnsavedChanges()) {
        if (documentEditor.SaveDocumentCallback)
            documentEditor.SaveDocumentCallback();
        else {
            var proto = frame[0].contentWindow.__aspxRichEdit;
            documentEditor.core.commandManager.getCommand(proto.RichEditClientCommand.FileSave).execute();
        }
    }
    var interval = setInterval(function () {
        if (!documentEditor.InCallback()) {
            clearInterval(interval);
            goClose();
        }
    }, 500);
}

var FilterExtension = {
    OnParameterChange: function (s, e) {
        value = s.cpValue,
            row = $(s.mainElement).parents('tr').first(),
            id = row.find('._f_operators:first table.drop_catalog:first').attr('id'),
            operatorsControl = eval(id);
        operatorsControl.ClearItems();
        ax.post('/FilterReference/GetComparisons/', { data: value }, function (resp) {
            for (var i = 0; i < resp.data.length; i++) {
                operatorsControl.AddItem(resp.data[i].value, resp.data[i].Type);
            }
            operatorsControl.SelectIndex(0);
            var v = value || s.cpValue;
            ax.post('/FilterReference/GetFilterControl', { strPath: v, op: resp.data[0].Type }, function (context) {
                var point = row.find('._f_control:first');
                point.empty();
                point.append("<table><tr>" + context.Text + "</tr></table>");
            });
        });
    },
    AddCondition: function (s, e) {
        var table = $('.f_content table:first');
        var first = !!FilterExtension.CreateViewModel().Conditions.length;
        ax.post('/FilterReference/AddCondition/', { firstCondition: !first }, function (data) {
            table.append(data.Text);
        });
    },
    OnDropDown: function (s, e) {
        if (typeof (dx_filter_btn_choser_ok) != 'undefined')
            dx_filter_btn_choser_ok.cpEditor = s
        if (typeof (dx_filter_btn_choser_cancel) != 'undefined')
            dx_filter_btn_choser_cancel.cpEditor = s;
        var div = $(s.GetDropDownDivContainer());
        if (div.has('div').length)
            return;
        var cont = $('.dx_dropdown_parameters_wrap:first');
        cont.appendTo(div);
    },
    GetFolderId: function () {
        try {
            if (!filtersTree)
                return false;

            var key = filtersTree.GetSelectedNode().name;
            if (key == "0") key = "1";
            if (filtersTree.GetSelectedNode().target == "") key = 0;
            return key;
        }
        catch (e) {
            return 0;
        }
    },
    CreateViewModel: function () {
        var name = filterNameDx.GetText(),
            table = $('div.f_content:first table:first'),
            conditions = [],
            lastOperator = null;
        table.find('.filter_option_row').each(function () {
            if ($(this).hasClass('_condition_row')) {
                var parameter = eval($(this).find('.dx_dropdown_control:first').attr('id')).cpValue;
                var operator = eval($(this).find('.drop_catalog:first').attr('id')).GetValue();
                var container = $(this).find('.value_column_ .value_div');
                var containerData = ASPxClientUtils.GetEditorValuesInContainer(container[0]);
                var valueControl = eval(Object.keys(containerData)[0]);
                var value = (valueControl.isASPxClientDateEdit ? null : valueControl.cpValue) || valueControl.GetValue();
                if (valueControl.cpData && !valueControl.cpComboType)
                    value = JSON.stringify(valueControl.cpData);
                if (valueControl.cpAsUserControl)
                    value = valueControl.GetText();
                conditions.push({
                    ParameterPath: parameter,
                    OperatorName: operator,
                    ValueString: value,
                    LogicalOperator: lastOperator
                });
                lastOperator = null;
            }
            else {
                var logicalOperator = eval($(this).find('.drop_catalog:first').attr('id')).GetValue();
                lastOperator = logicalOperator;
            }
        });
        var FolderId = FilterExtension.GetFolderId();
        var model = {
            Name: name,
            FolderId: FolderId,
            Conditions: conditions,
            SaveInReference: saveInside.GetValue()
        };
        return model;
    },
    Save: function (s, e) {
        var model = FilterExtension.CreateViewModel();
        ax.post('/FilterReference/SaveFilterModel', { model: model, fromTree: FilterExtension.fromTree }, function () {
            CloseDialog($(s.mainElement));
            CurrentGlobal.PerformCallback();
        });
    },
    DeleteCondition: function (s, e) {
        var condition = $('.condition_selected:first');
        var logic = condition.prev();
        condition.remove();
        logic.remove();
        this.ValidateFilter();
    },
    Select: function (s, e) {
        if (e.node.target != "")
            return;

        ax.post('/FilterReference/GetFilterData/', { id: e.node.name }, function (data) {
            $('.filter_wrap:first').html(data.Text);
            filterNameDx.SetText(data.Name);
            filterValidatorText.SetText(data.filterStr);
        });
    },
    ValidateFilter: function (s, e) {
        var model = FilterExtension.CreateViewModel();
        ax.post('/FilterReference/ValidateFilter', { model: model }, function (context) {
            if (!context.data.valid && s)
                alert('В Фильтре присутствуют ошибки');
            filterValidatorText.SetText(context.data.str);
        });
    },
    OnLogicalChange: function (s, e) {
        var operator = s.GetValue(); var row = $(s.mainElement).parents('tr').first()
        var pathControl = row.find('._f_parameters_list:first .dx_dropdown_control:first').attr('id');
        var path = eval(pathControl).cpValue;
        if (["IsOneOf", "IsNotOneOf"].indexOf(operator) != -1) {
            ax.post('/FilterReference/GetVariableControl', { path: path }, function (context) {
                var point = row.find('._f_control:first');
                point.empty();
                point.append("<table><tr>" + context.Text + "</tr></table>");;
            });
        }
    }
}

function InitFonts(s, e) {
    $("body").css("cursor", "wait");
    var elem = $(s.GetListBoxScrollDivElement());
    elem.find('.dx_font_item').each(function () {
        $(this).css({ 'font-family': $(this).text() })
    });
    $("body").css("cursor", "default");
}

var structureHelper = function (tree) {
    this._tree = tree;
    this._createMasterCache = function () {
        var key = CurrentTree.GetFocusedNodeKey();
        var linkCell = $(CurrentTree.GetRowByNodeKey(key)).find('.structure_link_cell:first');
        var masterObjectData =
            {
                objectId: parseInt(linkCell.data('masterid')),
                relationGuid: linkCell.data('guid'),
                referenceId: CurrentTree.GetReferenceData().ReferenceId
            };
        this.masterCache = masterObjectData;
    };
    this._isParentCheckedOut = function () {
        var _getParentName = function ($elem, id) {
            if ($elem.data('id') == id)
                return $elem.data('name');
            return _getParentName($elem.prev(), id);
        }
        var key = this._tree.GetFocusedNodeKey();
        var row = $(this._tree.GetRowByNodeKey(key));
        var linkCell = row.find('.structure_link_cell:first, .structure_child_object_cell');
        var checkedOut = linkCell.data('checkedout');
        var name = _getParentName(row, linkCell.data('masterid')); //%TODO RESX
        if (checkedOut != "True" && !confirm("Взять на редактирование родительский объект '" + name + "' на редактирование?")) 
            return false;

        return true;
    };
    this.addLinkObject = function () {
        if (!this._isParentCheckedOut())
            return;
        structureHelper.currentTreeList = this._tree;
        this._createMasterCache();
        ax.post('/ObjectStructure/GetGroupAddingPopup',
            {
                relationGuid: this.masterCache.relationGuid,
                referenceId: this.masterCache.referenceId,
                objectId: this.masterCache.objectId
            }, function (data) {
                AddDialog(data.Text);
            });
    };
    this.removeLinkObject = function (e) {
        if (!this._isParentCheckedOut())
            return;
        e.preventDefault();
        var treeKey = this._tree.GetFocusedNodeKey(),
            row = $(this._tree.GetRowByNodeKey(treeKey)),
            linkCell = row.find('.structure_child_object_cell'),
            guid = linkCell.data('guid'),
            RefId = this._tree.GetReferenceData().ReferenceId,
            parentId = linkCell.data('masterid');
        var tree = this._tree;
        ax.post(ax.links.removeLink,
            {
                container: [EncodeKey(treeKey)],
                ReferenceId: RefId,
                structure: true,
                guid: guid,
                ParentId: parentId
            },
            function (d) {
                tree.PerformCallback();
            });
    };
    this.treeListNodeClick = function (s, e) {
        //  treeListProto.RaiseCustomTreeListClick.call(s, s, e);
        var $treeElem = $(CurrentGlobal.mainElement);
        $treeElem.find('li.no_display').removeClass('no_display');
        var commands = $treeElem.find('.CommandButton-Line-Container');
        var row = $(this._tree.GetRowByNodeKey(e.nodeKey));
        var groupCell = row.find('.structure_link_cell, .structure_children_cell');

        if (groupCell.length) {
            commands.addClass('no_display');
            var showData = groupCell.data('commands');
            if (showData) {
                showData.Add && $treeElem.find('._addobject').removeClass('no_display');
                showData.Create && $treeElem.find('._structure_create').removeClass('no_display');
            }
        }
        else {
            commands.removeClass('no_display');
            $treeElem.find('._create').addClass('no_display');
            var objectCell = row.find('.structure_child_object_cell');
            if (objectCell.length) {        
                $treeElem.find('._addobject, ._structure_create').addClass('no_display');
                var showData = objectCell.data('commands');
                if (showData) {
                    !showData.Remove && $treeElem.find('._remove_link').addClass('no_display');
                    !showData.Delete && $treeElem.find('._delete').addClass('no_display');
                }
                if (row.data('referenceid') != this._tree.GetReferenceData().ReferenceId) {
                    $treeElem.find('._user_event').addClass('no_display');
                }
            }
        }
        $('li:has(.no_display)').addClass('no_display');
        setTimeout(dialogHelper.OnResize, 1);
    };
    this.setLinkedObject = function (s, e) {
        var ctrl = $(s.mainElement);
        var parent = ctrl.parents('.dxpc-content').first();
        var gridName = parent.find('.Grid-Control-Class2:first');
        InitilizeGrid(gridName);
        var model =
            {
                RootRefId: this.masterCache.referenceId,
                RootObjId: this.masterCache.objectId,
                LinkGuid: this.masterCache.relationGuid,
                IsStructureMode: true,
                Ids: CurrentGlobal.GetSelectedKeys()
            };
        var tree = this._tree;
        ax.post('/DialogChanges/AddToManyObjectRow', {
            container: model,
            structureData: this._tree.GetCallBackArguments().StructureData
        }, function () {
            CloseDialog(ctrl);
            tree.PerformCallback();
        });
    };
    this.createObject = function () {
        if (!this._isParentCheckedOut())
            return;
        var linkCell = $(this._tree.GetRowByNodeKey(CurrentTree.GetFocusedNodeKey())).find('.structure_link_cell:first');
        var guid = linkCell.data('guid');
        this._createMasterCache();
        ax.post("/Commands/GetClassSelection", {
            ReferenceId: this._tree.GetReferenceData().ReferenceId, Guid: guid, structure: true
        }, function (data) {
            AddDialog(data.Text);
        });
    };
    this.onInit = function (tree) {
    }
}

structureHelper.createSelectedReferenceData = function () {
    var referenceData = CurrentGlobal ? CurrentGlobal.GetReferenceData() : null;
    if (CurrentTree && CurrentTree.cpStructureMode) {
        var row = $(CurrentTree.GetRowByNodeKey(CurrentTree.GetFocusedNodeKey()));
        referenceData.ReferenceId = row.data('referenceid');
    }
    return referenceData;
};

structureHelper.setLinkedObject = function (s, e) {
    var currentHelper = structureHelper.currentTreeList.structureHelper;
    var ctrl = $(s.mainElement);
    var parent = ctrl.parents('.dxpc-content').first();
    var gridName = parent.find('.Grid-Control-Class2:first');
    InitilizeGrid(gridName);
    var model =
        {
            RootRefId: currentHelper.masterCache.referenceId,
            RootObjId: currentHelper.masterCache.objectId,
            LinkGuid: currentHelper.masterCache.relationGuid,
            IsStructureMode: true,
            Ids: CurrentGlobal.GetSelectedKeys()
        };
    var tree = currentHelper._tree;
    ax.post('/DialogChanges/AddToManyObjectRow', {
        container: model,
        structureData: currentHelper._tree.GetCallBackArguments().StructureData
    }, function () {
        CloseDialog(ctrl);
        tree.PerformCallback();
    });
}

//TODO убрать лишние $
function ExpandClassMenu(ctrl, isClassBag) {
    var parent = ctrl.parents('.CommandButton-Line-Container').first();
    var bag = parent.find('.alt-menu:first');
    InitilizeGrid(ctrl);
    if (isClassBag && CurrentGlobal.UseTreeState()) {
        var selectedId = parseInt(CurrentGlobal.GetSelectedKey());
        var structure = JSON.parse(CurrentTree.cpClassStructure).filter(function (item) {
            if (item.children.indexOf(selectedId) != -1)
                return item;
        }).map(function (a) { return a.id });
        bag.find('.CreationClass-Bag-Item').each(function () {
            var id = parseInt($(this).data('id'));
            if (structure.indexOf(id) != -1)
                $(this).show();
            else
                $(this).hide();;
        });
    }

    bag.fadeToggle('fast');
    Allocate(ctrl.parents('.CommandButton-Line-Container').first());
}
function Allocate(ctrl) {
    if (!$('.ChangeViewBag:first').is(':visible') || !$('.alt-menu:first').is(':visible')) ctrl.addClass("Selected-Command");
    else { ctrl.removeClass("Selected-Command"); }
}