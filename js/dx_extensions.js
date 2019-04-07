if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString,position) {
        position = position || 0;
        return this.indexOf(searchString,position) === position;
    };
}


var commonDxProto = {
    GetCallBackArguments: function () {
        var data = this["cpCallBackArgs"];
        if (typeof data === "string")
            data = JSON.parse(data);
        return data;
    },
    SetCallBackArguments: function (prop, value) {
        var args = this.GetCallBackArguments();
        if (!args)
            return;
        if (prop == "FilterId" && value == "cache")
            value = 0;
        args[prop] = value;
        this["cpCallBackArgs"] = JSON.stringify(args);
    },
    CalculateUserValues: function (isCallback) {
        if (!this.cpHasCalcCells) return;
        setTimeout(function () {
            ax.post('/Commands/CalculateValues', { showIndicator: false }, function (resp) {
                console.log(resp);
            });
        }, isCallback ? 100 : 2000);
    },
    SetUserCommandsLoading: function (start) {
        if (start && this.cpStarted)
            return;
        var commandsPanel = $(this.mainElement).find('.commands-control:first');
        if (start) {
            var spinner = "<div class='spinner'><div class='spinner-icon'></div></div>";
            var initer = $("<div class='events_loader'>" + spinner + "<div>" + _localMessages.loading + "...  </div></div>");
            commandsPanel.prepend(initer);
            this.cpStarted = start;
            setTimeout(function () {
                this.SetUserCommandsLoading(false);
                //Заглушка. Максимум 10 секунд на время ожидания.
            }.bind(this), 10000);
        }
        else {
            commandsPanel.find('.events_loader').remove();
            this.cpStarted = false;
        }    
    }
}

var callBackPanelProto = {
    StartReloadTime: function(date){
        this.cpTimerId && clearInterval(this.cpTimerId);
        if (!date) return;
        var panel = this, time = (date.getMinutes() * 60 + date.getSeconds()) * 1000,
        refreshIntervalId = this.cpTimerId = setInterval(function () {
            try {
                if (!panel || !panel.mainElement)
                    clearInterval(refreshIntervalId);
                panel.PerformCallback();
            } catch (e) { console.log(e), clearInterval(refreshIntervalId) }
        }, time);
},
    SetControlEnabled: function (enable) {
        if (enable)
            $(this.mainElement).removeClass('dx_global_disabled_item');
        else
            $(this.mainElement).addClass('dx_global_disabled_item');
    },
    Components: function () {
        var parent = $('.global-panel[id=' + this.name + ']:first'),
       grid = eval(parent.find('.Grid-Control-Class2:first').attr('id')),
       tree = eval(parent.find('.TreelistDynamic:first').attr('id'));
        return { Grid: grid, Tree: tree }
    },
    OnPanelStateReady: function (data, pane) {
        if (!data.Data || !data.Data.content)
        {
            console.log('emtpy container');
            pane.find('.loaded_pane, .InvisibleContainer').remove();
            return;
        }
        pane.html(data.Data.content);
        pane.find('.ControlTabs').each(function () {
            var item = $(this).find('.TabControl:first');
            item.trigger('click');
        });
        InitDiag(null);
        pane.find('.loaded_pane').remove();
        $('.properties-panel:empty').remove();

        if (this.cpWinType && ['Mail','Tasks'].indexOf(this.cpWinType) != -1)
            this.Components().Grid.onMessageReaded();
    },
    Reload: function(){
        var control = this, controls = this.Components();
        switch (this.GetViewMode()) {
            case ("Tree"):
                control = controls.Tree;
                break;
            case ("Grid"):
                control = controls.Grid;
                break;
            case ("Explorer"):
                var _existsElem = function (c, key) {
                    return $(c).find('tr[data-id=' + key + ']').length;
                };
                var key = this.GetSelectedKeys()[0];
                if (controls.Tree && controls.Tree.cpGanttTree)
                {
                    controls.Tree.PerformCallback();
                    return;
                }
                   var existsTree = controls.Tree ? _existsElem(controls.Tree.mainElement, key) : false,
                    existsGrid = _existsElem(controls.Grid.mainElement, key);
                if (existsTree && !existsGrid)
                    control = controls.Tree;
                if (existsGrid && !existsTree)
                    control = controls.Grid;
                break;
        }
        control.PerformCallback();
    },
    RefreshControl:function() {
        var items = this.Components();
        (this.GetViewMode() !== "Tree" ? items.Grid : items.Tree).PerformCallback();
    },
    Initilize: function (isCallback) {
        !isCallback && this.StartReloadTime(this.cpReloadTimer);
        var parent = $(this.mainElement);
        this.OnViewModeChange = function () {
            var mode = this.GetViewMode();
            panel = parent.find('.filter_option_panel:first');
            c = mode == "Tree" ? '_filter_mode_tree' : (mode == "Grid" ? '_filter_mode_grid' : '');
            panel.removeClass('_filter_mode_tree').removeClass('_filter_mode_grid');
            panel.addClass(c);
        };
        var point = parent.find('.Splitter-Container:first'),
        mode = parent.find('.Reference-Control:first').data('mode'),
        pos = point.attr('position'),
        lefcol = point.find('.left-side-splitter:first').width(),
        rightcol = point.find('.right-side-splitter:first').width();
        if (lefcol == rightcol) { lefcol = lefcol / 2; rightcol = lefcol; }
        var left = lefcol > 100 ? parseInt(lefcol) + 'px' : parseInt(lefcol) + '%',
        right = rightcol > 100 ? right = parseInt(rightcol) + 'px' : parseInt(rightcol) + '%';
        parent.find('.view-config-menu .d_mode[data-mode=' + mode + ']').find('.descript').addClass('checkedItem');
        if (this.cpShowAllChildren)
            parent.find('.view-config-menu .all_children_btn:first').addClass('checkedItem');
        var grid = {}; 
        try {
            grid = this.Components().Grid;
            if (grid) {
                var index = grid.cpFocusIndex || 0;
                var initRow = grid.GetRow(index);
                InitCommands.call(initRow, { target: initRow }, true);
                grid.SelectItem(index, true);
            }
        }
        catch (e) {
            console.log(e);
        }
        dialogHelper.initControls(parent);
        if ($('body').hasClass('mobile_screen'))
            dialogHelper.OnResize(parent);
        if (parent.parents('.TableContainerColumn').length) {

            //dialogHelper.initControls(parent);
            //dialogHelper.OnResize();
            return;
        }
        if (point.parents('.box_global').length) {
            switch (mode) {
                case ("Explorer"):
                    left = "30%"; right = "70%";
                    break;
                case ("Grid"):
                    left = "0%";
                    right = "100%";
                    break;
            }
        }
        var settings = ((right == "0px" || right == "0%") && !this.cpWinType) ? [{ size: "100%", min: 0 }] : [{ size: left, min: 0 }, { min: 0, size: right }];
        point.jqxSplitter({ width: "100%", height: "100%", showSplitBar: (left !== "0%" && !$('body').hasClass('mobile_screen')), panels: settings });
        initGrid();
       // $(window).trigger('resize');
        point.attr("style", "height:100%");
        if (lefcol === 0)
            point.find(".jqx-fill-state-pressed:first").trigger("click");
        parent.find('.jqx-fill-state-normal:first').addClass('my_splitter');
        parent.find('.Splitter-Container').on('resize', function (e) {
            grid && grid.FixWidth();
        });
        $('.jqx-splitter-collapse-button-vertical').addClass('custom-spl');
        $('#MainContainer .jqx-splitter-splitbar-vertical').mouseout(function () {
            var parent = $(this).parents('.Splitter-Container').first(),
             leftcolumn = parent.find(".left-side-splitter:first"),
             left = leftcolumn.width() / leftcolumn.parent().width() * 100,
             rightcolumn = parent.find(".right-side-splitter:first"),
             right = rightcolumn.width() / rightcolumn.parent().width() * 100,
             lc = parseInt(left);
            if (lc > 100) lc = 30;
            var rc = parseInt(right);
            if (rc > 100) rc = 70;
           ax.post(ax.links.sp_width,{ left: lc, right: rc, showIndicator:false });
        });

        if (parent.parents('.Desktopcontainer').length) {
            //if (this.cpUnreadedCount) {
            //    mailService.SetMailUnread(this.cpUnreadedCount);
            //}
        }
        else {
            if (pos != 'none' && typeof pos !== 'undefined')
                PropPanel(this.GetReferenceData ? this.GetReferenceData().ReferenceId : null, point, pos);
        }

        setTimeout(function () {
            $('#MainContainer').fadeIn('slow', function () {
                initGrid();
                $(window).trigger('resize');
            });
        }, 200);

        (function _initHovers() {
            if (parent.parents('#working-page-frame').length && !parent.parents('.page-cust-column').length) {
                parent.find('.hint--top, .hint--top--custom, .hint--top--left')
                    .each(function () { $(this).attr('class', 'hint--left'); });
            }
        }());
    },
    GetReferenceData: function () {
        var argums = this.GetCallBackArguments();
        if (!argums)
            return null;
        return argums.ReferenceData || null;
    },
    GetSelectedKeys: function () {
        try {
            var parent = $('.global-panel[id=' + this.name + ']:first'),
            grid = eval(parent.find('.Grid-Control-Class2:first').attr('id')),
            tree = eval(parent.find('.TreelistDynamic:first').attr('id')),
            Gridkeys = grid ? grid.GetSelectedKeysOnPage() : [];
            if (!tree)
                return Gridkeys;
            if (tree.cpContextRowKey) return tree.cpContextRowKey;
            var Treekeys = EncodeKey(tree.GetFocusedNodeKey());
            return (Gridkeys.length != 0 && this.GetViewMode() != "Tree") ? Gridkeys : Treekeys;
        }
        catch (e) {
            return null;
        }
    },
    GetSelectedKey: function () {
        var keys = this.GetSelectedKeys();
        if ((keys instanceof Array) && keys.length != 0)
            return keys[0]
        else return keys;
    },
    GetViewMode: function () {
        var parent = $('.global-panel[id=' + this.name + ']:first'),
    row = parent.find('.view-config-menu .checkedItem:first');

        if (parent.parents('.TableContainerColumn').length)
            return "Grid";

        return row.length ? row.parents('.d_mode').first().data('mode') : null;
    },
    RefreshSplitters: function () {
        $('.global-panel').each(function () { $(this).find('.descript.checkedItem').trigger('click'); })
    },
    ShowPanel: function () {
        var parent = $('.global-panel[id=' + this.name + ']:first'),
   option = parent.find('.view-config-menu .view-changes-row .checkedItem').data('panel-option');
        if (typeof option === "undefined")
            return false;
        return option != "none";
    },
    GetParentId: function (objectId, fromTreeList, onRootDrag) {
        try {
            var parent = $('.global-panel[id=' + this.name + ']:first');
            if (!parent.length)
                return null;
            var tree = eval(parent.find('.TreelistDynamic:first').attr('id')),
                fullMode = this.GetViewMode(),
            id = (objectId && (fullMode !== "Tree" || onRootDrag)) ? objectId : tree.GetFocusedNodeKey(),
            row = tree.GetNodeHtmlElement(id),
            grid = eval(parent.find('.Grid-Control-Class2:first').attr('id')),
                IsExplorerMode = (fullMode == "Explorer" || fullMode == "grid");

            if (fullMode == "Explorer" && grid.GetVisibleRowsOnPage() == 0)
                IsExplorerMode = false;

            return (IsExplorerMode && !fromTreeList) ? EncodeKey(id) : $(row).data('parentId');
        }
        catch (e) {
            return null;
        }
    },
    onAfterCreateObject: function (data) {
        var command = $(this.mainElement).find('._create:first .CommandButton');
        if (!command.length)
            return;
        command.attr('onclick', data.click);
        command.find('a').text(data.text);
        command.find('img').attr('src', data.icon);
    },
    CallCommandTrigger:function(selector)
    {
        var item = $(this.mainElement).find(selector + ':first .CommandButton');
        item && item.trigger('click');
    },
    GetObjectInfo: function (callbackDataContext) {
        CurrentGlobal = this; var result = "";
        ax.post('/DialogChanges/GetRoName/', { id: this.GetSelectedKey(), ajaxOptions: { asynchronus: false } }, function (resp) {
            result = resp.Text; var select = $('select#macros_methods'); select.empty();
            if (callbackDataContext == 'methods') {
                for (var i = 0; i < resp.data.methods.length; i++) {
                    dx_methods_items.AddItem(resp.data.methods[i]);
                }
            }
        });
        return result;
    }
    ,
    UseTreeState: function () {
        var mode = this.GetViewMode();
        if (!CurrentGrid) return true;
            return (mode == "Tree" || (mode == "Explorer" && !CurrentGrid.GetDataItemCountOnPage()));
    },
    Commands: function () {
        var container = $(this.mainElement),
            commands = new Array();
        container.find('.CommandButton-Line-Container').each(function () {
            commands.push($(this));
        });
        return commands;
    },
    HideCommand: function () {
        var args = arguments;
        this.Commands().forEach(function (entry) {
            for (i = 0; i < args.length; i++) {
                if (entry.hasClass(args[i])) {
                    entry.hide();
                }
            }
        });
    },
    ShowCommand: function () {
        var args = arguments;
        this.Commands().forEach(function (entry) {
            for (i = 0; i < args.length; i++) {
                if (entry.hasClass(args[i]) && dialogHelper.CanShow(entry)) {
                    entry.css({ "display": "inline-block" });
                }
            }
        });
    },
    RefreshContentData: function (elem) {
        var tree = this.Components().Tree;
        if (tree && tree.cpStructureMode)
            return this.Components().Tree.PerformCallback();
        this.Reload();
    }
}

var treeListProto = {
    onInit: function(s,e){
        //s.ScrollTo(s.cpFocusId); %TODO
      
        setTimeout(function () {
            s.AdjustControl();
            s.MakeNodeVisible(s.GetFocusedNodeKey());
         
        }, 500);
        s.InitRowCommands(null,true);
        if (s.cpInitOnRoot)
        {
            //var grid = eval(s.cpGridName);
            //if (grid)
            //    grid.HideCommand('_moveUp_folder');
            InitilizeGrid($(s.mainElement));
            CurrentGlobal.HideCommand('_moveUp_folder');
        }
            
        setTimeout(function () {
            s.CalculateUserValues(true);
        }, 1000);
        if (s.cpStructureMode) {
            s.structureHelper = new structureHelper(s);
        };
    },
    BeforeBeginCallback: function (s, e) {
        s.SetCallBackArguments("VerticalScrollPosition", s.GetVerticalScrollPosition());
        e.customArgs['CallBackArgs'] = s['cpCallBackArgs'];
    },
    EndCallback: function (s, e) {
        s.CalculateUserValues(true);
        s.InitRowCommands(); 
        s.SetVerticalScrollPosition(s.GetCallBackArguments().VerticalScrollPosition);
    },

    GetParentIdByElement: function (element) {
        var _getParentId = function (item) {
            var _parent = $(item.prev());
            if (_parent.length == 0)
                return null;
            var IsParent = _parent.data('parent'),
                ParentIndent = _parent.find('.dxtlIndent_Office2010Silver').length;
            if ((_parent.hasClass('tree_parent_node') || IsParent) && ParentIndent == IndentCount)
                return _parent.data('id');
            else return _getParentId(_parent);
        };
        return _getParentId($(element));
    },
    GetFocusedPath:function(key){
        var row = $(this.GetRowByNodeKey(key || this.GetFocusedNodeKey())),
        path = [row.data('id') || 0], parentId = row.data('parent-id');
        if (!parentId)
            return path;
        var findParent = function (elem, id) {
            var prev = elem.prev();
            if (!prev.is('tr')) return null;
            if (prev.data('id') == id) {
                path.push(prev.data('id'));
                if (prev.data('parent-id'))
                    findParent(prev, prev.data('parent-id'));
            }
            else findParent(prev, id);
        }
        findParent(row, parentId); path.push(0);
        return path.reverse();
    },
    GetFocusedParentRow:function()
    {
        var row = $(this.GetRowByNodeKey(this.GetFocusedNodeKey()));
        var parentId = row.data('parent-id') || "0";
        var findParent = function (elem, id) {
            var prev = elem.prev();
            if (!prev.is('tr')) return null;
            if(prev.data('id') == id)
                return prev;
            return findParent(prev, id);
        }
       return findParent(row, parentId);
    },
    GetKey: function () {
        var key = this.GetFocusedNodeKey();
        return (key == "0" || key == 0) ?
            key : EncodeKey(key);
    },
    LoadObjects: function () {
        this.SetCallBackArguments("LoadingMode", true);
    },
    GetLoadedCount: function () {
        return null
    },
    Setcount : function(count){
        this.SetCallBackArguments("Count", count);
        this.SetCallBackArguments("LoadingMode", true);
    },
    GetKeyInteger : function () {
        return (this.nodeKey == "0" || this.nodeKey == 0) ?
            this.nodeKey : EncodeKey(this.nodeKey);
    },
    ScrollTo : function (id) {
        var name = this.name;
        setTimeout(function () {
            var table = $('.TreelistDynamic[id=' + name + ']'),
                point = table.find('.dxtlCSD:eq(1)'),
                row = table.find('.tree_cell_row[data-id=' + id + ']');
            if (row.length != 0) {
           //     row.trigger('click');
                point.animate({
                    scrollTop: row.offset().top - 240
                }, 'slow');
            }
        }, 400);
    },
    OnHeaderClick: function (e) {
        if ($(e).hasClass('grid_com_col'))
            e = e.parentNode;
            var index = this.GetLastNumberOfId(e);
            if (index < 0) index = $(e).index() - 1;
            var column = this.GetColumnByIndex(index);
            this.SetCallBackArguments("SortedField", column.name);
            this.PerformCallback();
    },
    InitRowCommands: function (a, timeOut, hideAll) {
        if (hideAll) {
            //var elems = $(CurrentGlobal.mainElement)
            //    .find(".commands-control:first .CommandButton-Line-Container:not([class*=' _contr'])");
            //elems.show();
        }
        row = a || $(this.GetRowByNodeKey(this.GetFocusedNodeKey()));
        if (timeOut)
            setTimeout(function () {
                InitCommands.call(row, { target: row }, null)
            }, 600);
        else 
            InitCommands.call(row, { target: row }, null)
    }
    ,
    RaiseCustomTreeListClick: function (s, e) {
        var row = $(e.htmlEvent.target);
        s.InitRowCommands($(row).parents('tr').first());
        var context = s.GetReferenceData().ReferenceId;
        if (s.cpStructureMode)
            context = context + "$structure";
        viewStorage.setFocusId(context, s.GetKeyInteger.call(e));
    }
}

var gridViewProto = {
    contexUserItemClass: 'context_event_',
    adjustSizeColumnsWidth: function (s,e) {
        var index = this.cpWinType ? 2 : 3,helper = this.GetResizingHelper();
        for (var i = 3; i < CurrentGrid.GetColumnsCount(); i++) {
            helper.ApplyColumnWidth(i,"auto");
            if (this.GetColumn(i).name === "status_col")
                helper.ApplyColumnWidth(i,"30px")
        }
    },
    desktopInitGridView: function (s,e) {
        initGrid(true); initHeight(); $(window).trigger('resize');
        s.cpInitWidth && SaveColumnWidth.call(s,s,e);
    },
    onMessageReaded: function () {
        var id = parseInt(this.GetSelectedKeysOnPage()[0]),
            book = this.cpUnreaded || [];
        if (book.indexOf(id) != -1) {
            var $row = $(this.mainElement).find('.Grid-Row-Class2[data-id=' + id + ']:first');
            $row.data('unreaded',false).attr('data-unreaded',false);
            book.remove(id);
            this.cpUnreaded = book;
            //var tree = eval(this.cpTree),
            //point = $('#' + tree.GetSelectedNode().contentElementID).find('.unread_point:first'),
            //count = point.data('count'); count--;
            //point.text('(' + count + ')').attr('data-count',count).data('count',count);
        };
    },
    mailGridBeginCall: function (s,e) {
        e.customArgs['DynamicTree'] = s.cpTree;
        e.customArgs['DynamicName'] = s.name;
        e.customArgs['FolderKey'] = s.cpFolderId;
        e.customArgs['IsMail'] = s.cpIsMail;
        e.customArgs['AccountGuid'] = AccountGuid;
    },
    desktopGridBeginCall: function (s,e) {
        e.customArgs['DynamicName'] = s.name;
        e.customArgs['MovingIndexes'] = e.command == "COLUMNMOVE" ? JSON.stringify(s.cpMoveIndexes) : null;
        if (s.cpWinType === 'Mail' || s.cpWinType === 'Tasks')
            s.mailGridBeginCall(s,e);
    },
    updateViewList: function (s,e) {
        var ul = $(s.mainElement).parents('.global-panel').first().find('.ChangeViewBag:first');
        ul.html(s.cpViews);;
    },
    mailGridEndCall: function (s,e) {
        DesktopGridClick(s.cpWinType,s.GetRowKey(0),true,s,e);
        if (!s.GetSelectedRowCount()) { s.SelectItem(0,true); } initGrid();
        s.updateViewList(s,e);
    },
    GoToPage: function (action) {
        var p = this.GetCallBackArguments().CurrentPage;
        switch (action) {
            case ('next'):
                p += 1;
                break;
            case ('prev'):
                p -= 1;
                break;
            case ('none'):
                break;
        }
        this.SetCallBackArguments('CurrentPage',p);
        this.PerformCallback();
    },
    OnColumnFilterInputChanged: function (editor) {
        // if (!editor.GetDate)
        // return false;
        if (editor.RaiseDropDownEventRequired == false) {
            this.FilterKeyPressEditor = editor;
            this.PerformCallback();
        }

        return false;
    },
    ScrollToFocus: function () {
        var name = this.name;
        setTimeout(function () {
            var table = $('.Grid-Control-Class2[id=' + name + ']'),
                point = table.find('.dxgvCSD:first'),
                focusId = table.find('.grid_footer_data:first').data('focused'),
                row = table.find('.Grid-Row-Class2[data-id=' + focusId + ']');
            if (row.length != 0) {
                var to = row.offset().top - 160;
                row.trigger('click');
                if (to < 600)
                    return false;
                point.animate({
                    scrollTop: row.offset().top - 160
                },'slow');
            }
        },100);
    },
    FilterRowMenuItemClick: function (item) {
        var itemName = item.name.substr(0,item.name.indexOf("|"));
        this.FilterTypeIndex = itemName;
        if (this.allowMultiColumnAutoFilter) {
            this.filterRowConditions[this.filterRowMenuColumnIndex] = parseInt(itemName);
        } else {
            var args = [this.filterRowMenuColumnIndex,itemName];
            this.gridCallBack(["FILTERROWMENU"].concat(args));
        }
    },
    InstanceHeight: function () {
        var g = $(this.mainElement),h = 1;
        if (g.parents('.Splitter-Container').prev().is(':visible')) {
            h += 30;
        };
        return parseInt(g.find('.dxgvCSD:first').innerHeight() + h);
    },
    FillData: function () {
        this.SetCallBackArguments('Height',this.InstanceHeight());
        var tree = this.GetCallBackArguments().TreeListName;
        if (tree) {
            var calling = arguments.callee.caller.caller.toString();
            tree = eval(tree); var node = tree.GetCallBackArguments().NodeType;
            if (typeof node === "undefined")
                node = $(tree.GetNodeHtmlElement(tree.GetFocusedNodeKey())).data('type');
            this.SetCallBackArguments('NodeType',node);
        }
    },
    GetData: function () {
    },
    SaveOrder: function (s,e) {
        var grid = this;
        var container = [];
        InitilizeGrid($(grid.mainElement));
        var columns = $(grid.mainElement).find('.dx_gridview_header .grid_com_col');
        columns.each(function () {
            var name = $(this).text()
            if (name.length < 150 && name != " " && name != "") {
                container.push(name);
            }
        });
        ax.post(ax.links.saveOrder,{ showIndicator: false,array: container })
    },
    OnMoveColumn: function (s,e) {
        e.allow = true;
        if (e.sourceColumn.isCommandColumn || (e.destinationColumn && e.destinationColumn.isCommandColumn)) {
            e.allow = false;
            return false;
        }
    },
    Table: function () {
        return $('.Grid-Control-Class2[id=' + this.name + ']');
    },
    Commands: function () {
        return CurrentGlobal.Commands();
    },
    HideCommand: function () {
        if (!CurrentGlobal)
            InitilizeGrid($(this.mainElement));
        return CurrentGlobal.HideCommand.call(CurrentGlobal, arguments);
    },
    ShowCommand: function () {
        var args = arguments;
        this.Commands().forEach(function (entry) {
            for (i = 0; i < args.length; i++) {
                if (entry.hasClass(args[i]) && dialogHelper.CanShow(entry)) {
                    entry.css({ "display": "inline-block" });
                }
            }
        });
    },
    HideContextEvents: function () {
        this.GetRowContextMenu().GetRootItem().items.forEach(function (item) {
            if (item.name.startsWith(gridViewProto.contexUserItemClass))
                item.SetVisible(false);
        });
    },
    GetUserContextItemByID: function (id) {
        return this.GetRowContextMenu()
            .GetItemByName(gridViewProto.contexUserItemClass + id);
    },
    HideColumnInternal: function (column, tree) {
        if (!column || (!tree && !this._getColumn(column.index)) || column.isCommandColumn)
            return;
        var control = this;
        InitilizeGrid($(control.mainElement));
        var id = !!this.cpWinType ? this["cpWinType"] : this.GetReferenceData().ReferenceId;//s._getColumn(e.elementIndex)
        ax.post('/DisplayView/HideColumn/',{
            context: id,fieldName: column.name || column.fieldName, tree: tree
        },function () {
            control.PerformCallback();
        });
    },
    TriggerObjectCommand: function (nodeKey, commandName) {
        var trigger = (!nodeKey || nodeKey == "0") ? this.HideCommand : this.ShowCommand;
        trigger.call(this, commandName);
    },
    getScrollbarWidth: function () {

        if (this._scrollbarWidth)
            return this._scrollbarWidth;

        var outer = document.createElement("div");
        outer.style.visibility = "hidden";
        outer.style.width = "100px";
        outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

        document.body.appendChild(outer);

        var widthNoScroll = outer.offsetWidth;
        // force scrollbars
        outer.style.overflow = "scroll";

        // add innerdiv
        var inner = document.createElement("div");
        inner.style.width = "100%";
        outer.appendChild(inner);

        var widthWithScroll = inner.offsetWidth;

        // remove divs
        outer.parentNode.removeChild(outer);
        this._scrollbarWidth = widthNoScroll - widthWithScroll;

        return this._scrollbarWidth;
    },

    FixWidth: function (fixed, fixPopupElements) {
        var self = $(this.mainElement),
        parent = self.parents('.grid-control').first(),
        parentWidth = parent.width();
        if (self.parents('.TableContainerColumn').length && !fixPopupElements)
            return;
        if (fixed) { this.SetWidth(1600); return;}
        var headerDiv = $(this.GetHeaderScrollContainer()).find('div:first');
        var container = $(this.GetMainTable().parentElement);

        (function ($) {
            $.fn.hasScrollBar = function () {
                return has = this.get(0).scrollHeight > this.height();
            }
        })(jQuery);

        headerDiv.css({ "width": (container.hasScrollBar() ? (parentWidth - this.getScrollbarWidth()) : parentWidth) + "px" });
        container.css({ "width": parentWidth + "px" });
    }
}

var buttonProto = {
    PerformCallback: function (s, e) {
    // Не выполнять колбэк при отсутствии строки формлулы или макроса в контроле
        if(this.cpFormula){
            var pageId = $(this.mainElement).parents('.workingpage-table').first().data('page-id'), self = this;
            ax.post('/WorkingPage/ControlCallBack/', { name: this.cpControlName, pageId: pageId, formula: this.cpFormula }, function (data) {
                self.SetText(data.Text);
            });
        }
    },
    GetPopupCallbackPanel: function (s, e) {
        var $elem = $(s.mainElement),
            parent = $elem.parents('.TestPopupclass').first().find('.global-panel:first');
        return eval(parent.attr('id'));
    }
}
var buttonEditProto = {
    GetControlsByGuid: function (guid) {
        return $.makeArray($('.link_button_editor').map(function (item) {
            var ret = eval($(this).attr('id'));
            if (ret.jsonData && ret.jsonData.guid == guid)
                return ret;
        }));
    },
    SetValueInternal: function (data) {
        new valueHelper(data, this).SetValue();
    },
    // Устанавливает значение всех 1:1 контролов с одинаковым guid'ом
    SetSimiliarValue: function (data, value) {
        var items = this.GetControlsByGuid(data.guid);
        var singleTrigger = false;
        items.forEach(function (ret) {
            var input = $(ret.GetInputElement());
            if (!value) {
                input.val(null);
                var newData = ret.jsonData;
                newData.newValueId = null;
                if (!ret.cpUserControl)
                    valueHelper.SetLinkData(newData, "");
                else {
                    ret.cpValue = null;
                    singleTrigger = true;
                }
                ret.SetButtonVisible(2, false);
            }
            else {
                input.val(value.name)
                ret.cpObjectId = value.ID;
                ret.SetButtonVisible(2, !!value.ID);
                !ret.cpComboType && input.attr('onclick', value.url);
            }
        });

        //запрос на сервер посылаем только 1 раз
        if(singleTrigger && items.length)
            items[0].cpDescription != 'Variable' && items[0].RaiseValueChanged();
    },
    ReadUserValue: function (s, e) {
        var self = this;
        // Считываем значеие параметра выбранного справочника , если оно задано в текущем диалоге
        if (self.cpDescription != "Variable" && self.cpUserControl) {
            var parId = self.cpLinkedParameterId || null;
            this.controls = ASPxClientControl.GetControlCollection().GetControlsByPredicate(function (item) {
                if (item.cpValueType == 'referenceInfo' && item.cpParameter) {
                    var parInfo = JSON.parse(item.cpParameter);
                    if (parInfo.Id == parId) {
                        var asSingle = (self.cpValueType == 'parameter' && self.cpChosingData) ? true : false;
                        var chosingData = (asSingle && self.cpChosingData) ? JSON.parse(self.cpChosingData) : null;
                        if (chosingData) {
                            chosingData.ReferenceGuid = item.cpValue || _emptyGuid;
                            self.cpChosingData = JSON.stringify(chosingData);
                        }
                        else
                            self.cpChosingData = item.cpValue ? JSON.stringify(asSingle ? { ReferenceGuid: item.cpValue } : [{ ReferenceGuid: item.cpValue }]) : null;
                    }
                }
            });
        }
    }
}

var valueHelper = function (data, dxControl) {
    this.data = data || {};
    this.control = dxControl || null;
    this.dataString = JSON.stringify(this.data);
    this.isNative  = this.control.cpDescription != 'Variable';
    this.SetValue = function () {
        if (this.control) {
            switch (this.control.cpValueType) {
                case ("referenceObject"):
                    this.control.SetText(data.Text);
                    if (this.isNative) {
                        this.control.cpData = { valuePath: data.ValuePath };
                        this.control.GetValue = function () { return this.cpData.valuePath };
                        break;
                    }
                    this.control.cpData = { id: this.data.Id, RefId: this.data.LinkedReferenceId };
                    break;
                case ("parameter"):
                    var text = this.data;
                    if (this.isNative)
                        this.control.GetValue = function () { return this.cpValue; };
                    else
                        text = text.replace("[", "").replace("]", "");
                    this.control.SetText(text);
                    break;
                case ("referenceInfo"):
                    this.control.GetValue = function () { return this.cpValue; };
                    this.isNative = true;
                    break;
                default:
                    if (this.control.cpAsUserControl)
                    {
                        var control = this.control, data = this.data;
                        control.SetValue(data.Id);
                        control.EnsureDropDownLoaded(function () {
                            control.SetValue(data.Id);
                            control.SetText(data.Text);
                        })
                    }
                    break;
            }
            this.isNative && this.control.RaiseValueChanged();
            return;
        }
        var c = $('.filter_content').is(':visible') ? Filter.currentControl.parents('ul').first().find('input:first') :
        ChangingControl.parents('.ed-link').first().find('input:first');
        c.val(data.Text).data('value', this.dataString).attr('data-value', this.dataString);
        //Вызвать событие изменения значения контрола
        c.trigger('change');
    }
}

valueHelper.SetCustomValue = function (control, value) {

}
valueHelper.ReloadOneLink = function (data) {
    var linkData = JSON.parse(data.linkData);
    linkData.name = data.name;
    this.SetLinkData(linkData, data.url);
}
valueHelper.SetLinkData = function (data, url) {
    var control = buttonEditProto.GetControlsByGuid(data.guid)[0],
    input = $(control.GetInputElement()),
        jsonData = control.jsonData;

    if (input.parents('.complex_table').length)
        return false;

    var result = input.hasClass('UserControl') ? { "name": data.name, "ID": input.attr('parameter'), "GroupID": "" }
        : { Type: control.cpUserControl ? "IsDefault" : "Link", "ID": data.newValueId, "GroupID": jsonData.guid };
    _on_value_changed({
        info: result, ObjectId: jsonData.objectId, ReferenceId: jsonData.referenceId
    }, function () {
        if (result.ID)
            buttonEditProto.SetSimiliarValue(jsonData, { name: data.name, id: result.ID, url: url });
    });
}

valueHelper.GetFormData = function (form) {
    elem = $('#' +form).serializeArray().filter(function (x) {
        return x.name === "DXMVCEditorsValues";
    });
    return JSON.parse(elem[0].value);
}

valueHelper.GetData = function (control) {
    var list = control.data('values'),
    data = control.data('value') ? JSON.parse(control.data('value')) : {
            Text: control.val()
};
    if (control.attr('type') === 'number') {
        data.Text = parseInt(data.Text);
}
    data.ValueList = list;
    return data;
}

function EncodeKey(key) {
    return key.substring(0, key.indexOf('?'));
}
sessionHelper = {
    showModal: function (onbefore) {
        onbefore && onbefore();
        setTimeout(function () {
            $("body").prepend("<div id='connection_loading'><table><tr><td><span>"
                + _localMessages.connectionLoading + "</span></td></tr></table></div>")
        }, 1000);
    }
}

function OnCallBackError(s, e) {
    e.handled = true;
    try {
        var eObj = JSON.parse(e.message);
        if (eObj.Redirect) 
            sessionHelper.showModal(function () { $('.loader').hide(); window.location = "/" })
        else
            ShowError(eObj.Text);
    } catch (e) {
        ShowError(e.message);
    }
}

    function InitLink(s, e, data, id, referenceid) {
        s.jsonData = data || { IsAnyReferenceLink: true };
        var input = $(s.GetInputElement());
        s.SetButtonVisible(2, !!s.cpObjectId);

        if (!s.cpComboType) {
            input.addClass('link_input');
            if (id && referenceid) {
                var input = $(s.GetInputElement());
                var str = "ax.post('/Commands/HyperLink/',{ link : $(this).data('link') })";
                input.attr('data-link', JSON.stringify(data));
                $(s.GetInputElement()).attr('onclick', str);
            }
        }
    
        var td = $(s.GetButton(3)), url = '/FileReference/UploadFile?Child=true&Guid=' + s.jsonData.guid;
        if (s.cpFolderId)
            url += '&FolderId=' + s.cpFolderId;
        if (s.cpEditable === false) {
            td.addClass('_disabled_link_');
            return;
        }
        td.addClass('_import');
        form = $("<form></form>", { 'class': 'one_hidden_form', 'action': url, 'data-guid': s.jsonData.guid });
        form.append($("<input />", { 'class': 'upload-link', 'type': 'file', 'name': 'PostedFiles' }));
        td.append(form);
}

    function OnLinkControlClick(s,e) {
        switch (e.buttonIndex) {
            case 0:
                buttonEditProto.ReadUserValue.call(s,s,e);
                ChangeObjectLink(s.jsonData,s);
                break;
            case 1:
                $(s.GetInputElement()).attr('onclick', '');
                s.inputElement.value = (s.cpNullText || '');
                if (s.cpAsUserControl && s.EnsureDropDownLoaded)
                {
                    s.SetValue(null);
                    s.EnsureDropDownLoaded(function () {
                        s.SetValue(null);
                    });
                }
                s.RaiseValueChanged();
                break;
            case 3:
                break;
            case 2:
                window.open('/FileReference/DownloadMyFile?ObjectId=' + s.cpObjectId,'_blank_');
                break;
            default:

                buttonEditProto.SetSimiliarValue(s.jsonData,null);
                break;
        }
    }
    function OnExtensionButtonClick(s, e) {
        s.ReadUserValue();
        if (!s.ShowSelection) {
            s.ShowSelection = function (referenceId) {
                var data = {
                    type: this.cpValueType, referenceId: referenceId || 0,
                    control: this.name, settings: this.cpChosingData
                };

                // Переназначаем корневой справочник для выбора
                if (referenceId && CurrentGlobal && CurrentGlobal.GetReferenceData().ReferenceId != referenceId)
                    data.ReferenceData = { ReferenceId: referenceId };

                ax.post('/DialogChanges/GetTypeValueSelection/', data, function (data) {
                    AddDialog(data.Text);
                });
            }.bind(s);
        }
        switch (e.buttonIndex) {
            case 0:
                var referenceSelected = !!(s.cpRefId);
                if (!referenceSelected && s.cpChosingData) {
                    var data = typeof (s.cpChosingData) == 'string' ? JSON.parse(s.cpChosingData) : s.cpChosingData;
                    referenceSelected = (!!data.ReferenceGuid && data.ReferenceGuid != _emptyGuid);
                }
                if (referenceSelected)
                {
                    s.ShowSelection(s.cpRefId);
                    return;
                }

                ax.post('/DialogChanges/GetReferenceSelection', { control: s.name }, function (data) {
                    AddDialog(data.Text);
                });
                break;
            case 1:
                s.cpValue = null;
                s.SetValueInternal("");
                break;
        }
    }

    function controlChanged(s, e) {
        console.log(e);
}

    function beginCall(grid, e, RefId) {
    grid.SetCallBackArguments('MoveIndexes', e.command == "COLUMNMOVE" ? grid.cpMoveIndexes : null);
    grid.SetCallBackArguments("action", e.command);
    grid.FillData();
    e.customArgs["ReferenceId"] = RefId;
    e.customArgs["CallBackArgs"] = grid["cpCallBackArgs"];
}

    function TreeClick(s, e, grid, tree, id) {
        if(tree && tree.dragHelper)
            tree.dragHelper.CreateNodeDrag(e.htmlEvent.target, e, true);
        if (e.htmlEvent.target.className == "download_link") {
            e.cancel = true;
            return false;
        }
        if (e.htmlEvent.target.className == "load_tree_btn") {
            tree.LoadObjects();
            tree.SetCount(e.htmlEvent.target.dataset.count);
            console.log('loadtree');
            tree.PerformCallback();
            return false;
        }
        var row = $(e.htmlEvent.target),
            parent = row.parents('tr').prev(),
            ObjectId = e.nodeKey,
            node = $(s.GetNodeHtmlElement(e.nodeKey));

        if (ObjectId == "0") {
            grid.HideCommand('_moveUp_folder');
           
            if (CurrentGlobal.UseTreeState()) {
                InitCommands.CommandsOrder.forEach(function (item) { $(item.selector).hide() }); 
            }
        }
        else {
            grid.ShowCommand('_moveUp_folder','_new_window');
        }
        s.SetCallBackArguments('NodeType', node.data('type'));
 //       if(!s.cpOnly)
        grid.SetCallBackArguments('TreeFolderKey', s.GetKeyInteger.call(e));
        grid.SetCallBackArguments('RootObjectPath', s.GetFocusedPath(e.nodeKey));
        InitilizeGrid($(e.htmlEvent.target));
        var hasChildren = node.data('children'),
        mode = CurrentGlobal.GetViewMode();
        if (mode != "Tree")
            grid.PerformCallback();
        else
        {
            s.RaiseCustomTreeListClick(s, e);
            //if (!row.parents('tr').first().data('canbeparent'))
            //    CurrentGlobal.HideCommand('_create');
            //else
            //    CurrentGlobal.ShowCommand('_create');
        }

        if (!CurrentGlobal.ShowPanel() || mode != "Tree") {
            var panel = $(e.htmlEvent.target).parents('.global-panel').first(),
            pane = panel.find('.InvisibleContainer:visible');
            pane.empty();
            return false;
        }

        RefreshPanel(id, EncodeKey(ObjectId), CurrentGlobal.GetParentId(ObjectId), $(e.htmlEvent.target), true);
    }

    function beginCallTree(e, ReferenceId, tree) {
        e.customArgs['CallBackArgs'] = tree["cpCallBackArgs"];
        e.customArgs['ReferenceId'] = ReferenceId;
}

    function GridContextMenuClick(s, e, tree) {

        if (e.objectType == "emptyrow" && e.item.name == "refresh")
            s.PerformCallback();

        if (e.objectType === "row") {

            e.handled = true;
            var command = $.grep(InitCommands.CommandsOrder, function (a) {
                return a.dx_class == e.item.name;
            })[0] || null;

            if (!s && CurrentTree.cpStructureMode) {
                var selector = command.selector + ':first' + (command.selector.indexOf('_user_event') !== -1 ? '' : ' .CommandButton');
                return $(CurrentGlobal.mainElement).find(selector).trigger('click');
            }

            var id = parseInt(CurrentGlobal.GetSelectedKey());

            if (e.item.name == "dx_sign_row") {
                signatures.Init(s.GetReferenceData().ReferenceId, id);
                signatures.Get();
                return;
            }

            if (e.item.name == "refresh") {
                var control = tree ? CurrentTree : s;
                control.PerformCallback();
                return;
            }

            if (e.item.name == "pageProperty") {
                PageProperty();
                return;
            }

            if (e.item.name == "dx_sign_row_command")
            {
                signatures.Init(s.GetReferenceData().ReferenceId, id);
                signatures.Get(function () {
                    setTimeout(function () {
                        signButton3.RaiseClick();
                    }, 200);
                });
                return;
            }

            if (e.item.name.startsWith(gridViewProto.contexUserItemClass))
                command = { selector: '._user_event[data-id=' + e.item.name.replace(gridViewProto.contexUserItemClass, '') + ']' };

            var panel = {};
            if (s.cpWinType) {
                InitilizeGrid($(s.mainElement));
                panel = $(CurrentGlobal.mainElement);
                if (!e.item.index) {
                    ax.post('/Desktop/GetDialog/', {
                        type: s.cpWinType, key: s.GetSelectedKeysOnPage()[0] || ''
                    }, function (data) {
                        AddDialog(data.Text);
                    });
                    return;
                }
            }
            else {
                panel = $(eval(s.GetCallBackArguments().GlobalPanelName).mainElement);
                if (tree)
                    panel = $(CurrentGlobal.mainElement);
            }
            var selector = command.selector + ':first' + (command.selector.indexOf('_user_event') !== -1 ? '' : ' .CommandButton');
            panel.find(selector).trigger('click');
            if(CurrentTree)
             CurrentTree.cpContextRowKey = null;
            return;
        }

        var desktop = s.GetReferenceData() ? false : true;
        var id = desktop ? s["cpWinType"] : s.GetReferenceData().ReferenceId;
        switch (e.item.name) {
            case ("HideColumn"):
                e.handled = true;
                var column = s._getColumn(e.elementIndex);
                s.HideColumnInternal(column);
                break;
            case ("ShowCustomizationWindow"):
                e.handled = true;
                InitilizeGrid($(s.mainElement));
                ax.post("/DisplayView/GetViewSettings/", { ReferenceId: id, forTree: false, columnsTab: true
                }, function (data) {
                    AddDialog(data.Text);
                });
                break;
            case ("SortAscending"):
                if (desktop)
                    break;
                var column = s._getColumn(e.elementIndex);
                e.handled = true;
                OnSorting(s, { column: column }, "Ascending");
                break;
            case ("SortDescending"): 
                if (desktop)
                    break;
                if (e.elementIndex === -1)
                    break;
                var column = s._getColumn(e.elementIndex);
                e.handled = true;
                OnSorting(s, { column: column }, "Descending");
                break;
            case ("ShowFilterRow"):
                e.handled = true;
                InitilizeGrid($(s.mainElement));
                $(CurrentGlobal.mainElement).find('._filter_row_option:first').trigger('click');
                break;
            case ("properties"): 
                e.handled = true;
                var column = s._getColumn(e.elementIndex);
                InitilizeGrid($(s.mainElement));
                ax.post('/DisplayView/GetColumnSettings/', { context: id, fieldName: column.name || column.fieldName
                }, function (data) {
                    AddDialog(data.Text);
                });
                break;
    }
}

    function EndGridCallBack(s, e) {
        FixIEStyle();
          var  focus = s["cpFocusIndex"];
        s.UnselectAllRowsOnPage();
        s.SelectItem(focus, true);
        s.updateViewList(s, e);
        var row = s.GetRow(focus),
        cbArgs = s.GetCallBackArguments();
        InitCommands.call(row, { target: row }, null);
        var key = cbArgs.ReferenceData.ReferenceId,
         commandAction = s.ShowCommand;
        s.CalculateUserValues(true);
        if (!s.GetVisibleRowsOnPage()) {
            var p = eval(cbArgs.GlobalPanelName),
                viewMode = p.GetViewMode();
            commandAction = s.HideCommand;
            if (viewMode == "Explorer"){
                p.Components().Tree.InitRowCommands(null,null, true);
                var spl = $('.Splitter-Container:first');
                $('body.mobile_screen #MainContainer .Splitter-Container').length ?  
                    spl.jqxSplitter({ width: "100%", height: "100%", showSplitBar: true, panels: [{ size: "30%", min: 0 }, { min: 0, size: "70%" }] }) :
                    null;
            }
            if (viewMode !== "Tree")
                $(p.mainElement).find('.InvisibleContainer').empty();
            else return;
        }
     
        commandAction.call(s, '_remove_link', '_delete');
        s.ScrollToFocus();
        initGrid();

        //Триггер для проверки фильтров на скрытие/блокировки контролов диалога
        if ($(s.mainElement).parents(".InvisibleContainer").length) {
            s.GetValue = function(){ return null; };
            dialogHelper.OnValueChanged(s, null, true);
        }
    }

    function RefreshDesktopPanel(control, guid, type) {
        var panel = control.parents('.global-panel').first(),
        pane = panel.find('.properties-panel:visible');

        if (pane.length == 0 || !eval(panel.attr('id')).ShowPanel())
                return;

        pane.append(_loader);
        ax.post('/Desktop/GetWindowProperties', { showIndicator: false, type: type, ReturnDialog: false, containerKey: guid
        }, function (data) {
            pane.html(data.Text);
            InitDiag(null);
            pane.find('.loaded_pane').remove();
        });
}

    function DesktopGridClick(winType, ObjId, Selected, grid, node) {
        if (!ObjId)
                return;

        if (!grid.GetSelectedRowCount().length && !Selected) 
            $("._contr_read, ._mailItem_remove").hide();
        else 
            $("._contr_read, ._mailItem_remove").css({ "display": "inline-block" });
    
        var point = $(grid.mainElement);
        var parent = point.parents('.global-panel').first();
        var cc = parent.find('.CommandButton-Line-Container:eq(1)');
        var cc2 = parent.find('.CommandButton-Line-Container:eq(0)');
        var unlock = parent.find('._unlock');
        winType = grid["cpWinType"];
        if (winType === "Mail") {
            unlock.hide();
            cc.css({ "display": "inline-block" });
            cc2.css({ "display": "inline-block" });
            $('._msg_create, ._tsk_create').css({ "display": "inline-block" });
        }
        else {
            var showUnlock = $(grid.GetRow(node.visibleIndex)).data('unlock');
                unlock.css({ "display": ((typeof showUnlock !== "undefined") && !showUnlock) ? "inline-block" : "none" });
                $('._tsk_create, .recover_recycle, .delete_recycle').css({ "display": "inline-block"});
    }
        if (Selected && ObjId != null) {
            var pane = parent.find('.properties-panel:first'),
            global = eval(parent.attr("id"));
            if (pane.is(':visible') && global.ShowPanel()) {
                RefreshDesktopPanel(pane, ObjId, winType);
                grid.onMessageReaded();
        }
    }
}

    function MailItemClick(grid, e) {
        $("._contr_read").hide();
        $("._mailItem_remove").hide();
        var mail = true;
        AccountGuid = e.node.target;
        if (e.node.imageUrl != null) {
            mail = (e.node.parent && e.node.parent.name === "AllTasks" || e.node.name === "AllTasks") ? false : true;
            mail && showReplain(false);
        }
        else mail = false;
        var gridview = eval(grid),
        type = mail ? 'Mail' : 'Tasks';
        gridview.cpFolderId = e.node.name;
        if (mail && gridview.cpWinType != 'Mail' || (!mail && gridview.cpWinType == 'Mail')) {
            InitilizeGrid($(e.htmlElement));
            gridview.cpWinType = type;
            CurrentGlobal.PerformCallback();
        }
        else { 
            gridview.cpIsMail = mail;
            gridview.PerformCallback();
        }
    }

    function tlData_StartDragNode(s, e) {
        if (s.cpStructureMode || $('body').hasClass('mobile_screen'))
        {
            e.cancel = true;
            return false;
        }          
        var elem = e.htmlEvent.target,
        img = $(s.GetDragAndDropNodeImage());
        //  img.addClass('hidden_img');
        for (var y = 0 ; y < elem.classList.length; y++) {
            if (elem.classList[y] == s.ExpandButtonClassName ||
                elem.classList[y] == s.CollapseButtonClassName ||
                elem.dataset.expand == "true") {
                img.addClass('hidden_img');
                return false;
        }
    }
        img.removeClass('hidden_img');
        //var on_drag = s.dragHelper.OnNodeTargetChanged;
        //var on_new_drag = function(targets)
        //{
        //    on_drag(targets);
        //    if (!targets.targetElement)
        //        return false;

        //    var canMove = targets.targetElement.dataset.canbeparent,
        //        link = e.htmlEvent.ctrlKey;
        //    if (canMove == "false" && !link) {
        //        img.addClass('disabled_action');
        //    }
        //    else img.removeClass('disabled_action');
        //}
        //s.dragHelper.OnNodeTargetChanged = on_new_drag;
        var nodeKeys = s.GetVisibleNodeKeys();
        e.targets.length = 0;
        for (var i = 0; i < nodeKeys.length; i++) {
            if (s.GetNodeHtmlElement(nodeKeys[i]).getAttribute("nodeParent") == s.GetNodeHtmlElement(e.nodeKey).getAttribute("nodeParent")) {
                e.targets.push(s.GetNodeHtmlElement(nodeKeys[i]));
        }
    }
}

    function tlData_EndDragNode(s, e) {
        var nodeKeys = s.GetVisibleNodeKeys();
        for (var i = 0; i < nodeKeys.length; i++) {
            if (s.GetNodeHtmlElement(nodeKeys[i]) == e.targetElement) {
                var parentId = e.targetElement.dataset.id,
                    canMove = e.targetElement.dataset.canbeparent,
                    ToLink = e.htmlEvent.ctrlKey,
                    RefId = e.targetElement.dataset.referenceid,
                    id = EncodeKey(e.nodeKey),
                    parent = e.targetElement.dataset.name,
                    childElem = s.GetNodeHtmlElement(e.nodeKey),
                    child = childElem.dataset.name;
                var msg = ((ToLink ? _localMessages.Connect : _localMessages.Move) + " " + child + " => " + parent + "?").replace(/\n/g, " "),
                    ParentId = parentId ? parentId : 0,
                    RemoveId = null;
                var mode = ToLink ? "Link" : "Move";
                if (!ToLink) {
                    InitilizeGrid($(e.targetElement));
                    if (ParentId == 0) {
                        InitilizeGrid($(e.targetElement));
                        ParentId = CurrentGlobal.GetParentId(e.nodeKey, true, true);
                        mode = "Remove";
                    }
                    else {
                        RemoveId = CurrentGlobal.GetParentId(e.nodeKey, true, true);
                        mode = "MoveLink";
                }
            }

                if (confirm(msg)) {
                    ax.post('/Commands/OnDragNode', {
                            ReferenceId: RefId, Id: id, ParentId: ParentId, mode: mode, RemoveId: RemoveId, ToLink: ToLink
                    }, function (r) {
                        s.PerformCallback();
                        return true;
                    });
                }
                else {
                    e.cancel = true;
                    return false;
            }
        }
    }
}

    function InitEditor(s, e, id) {
        $(window).trigger('resize');
        $('#' + s.name + '_TBRow').addClass('_tool_row');
        s.GetValue = function () { return this.GetHtml();
    }
        s["cpParameter"] = { Id: id
    };
        $('.dx-editor').each(function () {
            var it = $(this).find('.ml-editor:first');
            var tab = it.find('table:first');
            var col = tab.find('.ml-editor:first');
            var table = col.find('table:first');
            table.css({ "display": "" });
        });
}

    function initGrid(NotimeOut, primary) {
    //    if (NotimeOut) {
    //        $('.Grid-Control-Class2').each(function () {
    //            if ($(this).parents('.TestPopupclass').length)
    //                return false;

    //            var grid = eval($(this).attr("id")),
    //                height = $(this).parents('.grid-control').first().height() -80,
    //                p = $(this).find('.dxgvCSD:first');
    //            if (!grid)
    //                return;
    //            var filterRow = $('#' + grid.name + '_' + grid.FilterRowID);
    //            if (filterRow.hasClass('_hidden')) {
    //                height += 25;
    //        }
    //            p.height(height);
    //            if (p.parents('.Desktopcontainer').length)
    //                //height += 5;

    //                p.attr('style', 'height:' + height + 'px;');
    //            grid.SetWidth(800);
    //        });
    //}
        //  setTimeout(function () {

        $('.Grid-Control-Class2').each(function () {
        //    if ($(this).parents('.TableContainerColumn').length) {
        //        if (primary)
        //            return false;
        //        var div = $(this).find('.dxgvCSD:first');//,
        //        height = div.parents('.right-side-splitter').first().height() -90;
        //        div.parents('.td').first().attr('style', 'vertical-align:top');
        //        div.height(height);
        //        return;
        //}

            // if ($(this).parents('.TestPopupclass').length)
            //     return false;

            var grid = eval($(this).attr("id"));
          //      p = $(this).find('.dxgvCSD:first'), gridControlH = $(this).parents('.grid-control').first().height();
           // height = gridControlH - p.position().top - 32;
            if (!grid)
                return;

            var fixed = grid["cpFixed"];
         //   if (fixed) height -= 20;

         //   p.height(height);
          //  p.attr('style', 'height:' + height + 'px;');
            grid.FixWidth && grid.FixWidth();
            //if (!fixed) {
            //   grid.SetWidth(800);
            // }

        });
        // }, 10);
}

    function OnSorting(s, e, type) {
        s.SetCallBackArguments('SortedField', e.column.name);
        if (type)
            s.SetCallBackArguments('OrderType', type);
        e.cancel = true;
        s.PerformCallback();
        return false;
}
    function OnTreeListHeaderClick(s, e) {
        switch (e.item.name) {
            case ("dx_tree_header_columns"):
                PageProperty(null, true, true);
                break;
            case ("dx_tree_header_hide"):
                var $elem = $(s.cpElement);
                if ($elem.hasClass('grid_com_col'))
                    s.cpElement = $elem.parent()[0];
                var index = CurrentTree.GetLastNumberOfId(s.cpElement);
                var column = CurrentTree.GetColumnByIndex(index);
                gridViewProto.HideColumnInternal.call(CurrentTree, column, true);
                break;
            case ("dx_tree_header_ascending"):
                CurrentTree.SetCallBackArguments('OrderType', "Ascending");
                treeListProto.OnHeaderClick.call(CurrentTree, (s.cpElement));
                break;
            case ("dx_tree_header_descending"):
                CurrentTree.SetCallBackArguments('OrderType', "Descending");
                treeListProto.OnHeaderClick.call(CurrentTree, (s.cpElement));
                break;
        }
    }
    function OnTreeListContextMenuInit(s, e) {
        InitilizeGrid($(e.htmlEvent.currentTarget));
        var r = $(CurrentTree.GetRowByNodeKey(e.objectKey));
        if (!r.data('id') && e.objectType != "Header")
            return;
        data = r.data('init');
        var menu = eval(s.name + "contextMenu");//CurrentGrid.contextMenuHelper.GetRowContextMenu();
        switch (e.objectType)
        {
            case ("Node"):
                break;
            case ("Header"):
                menu = eval(s.name + "contextMenuHeader");
                menu.elementInfo = { index: 0, objectType: "row" };
                menu.ShowAtPos(e.htmlEvent.clientX, e.htmlEvent.clientY);
                menu.cpElement = e.htmlEvent.target;
                return;
               // break;
        };
        if (data) {
            for (var i = 0; i < InitCommands.CommandsOrder.length; i++) {
                var item = InitCommands.CommandsOrder[i];
                var cR = menu.GetItemByName(item.dx_class),
                    show = ((cR && data.c[i]) || ["dx_prop_row", "dx_new_window_row"].indexOf(item.dx_class) != -1) || false;
                if (item.selector == '._unlock' && r.data('unlock') === false)
                    show = true
                if (cR)
                    cR.SetVisible(!!show);
            }
        }
        e.htmlEvent.preventDefault();
       // var nodeKey = s.GetNodeKeyByRow(e.htmlEvent.currentTarget);
        s.cpContextRowKey = EncodeKey(e.objectKey);
        if (s.cpStructureMode)
            CurrentTree.SetFocusedNodeKey(e.objectKey);
        menu.elementInfo = { index: 0, objectType: "row" };
        menu.ShowAtPos(e.htmlEvent.clientX, e.htmlEvent.clientY);
    }


    function OnContextInit(s, e) {
        if (e.objectType == "row") {
            var r = $(s.GetRow(e.index));
            data = r.data('init');
            for (var i = 0; i < InitCommands.CommandsOrder.length; i++) {
                var item = InitCommands.CommandsOrder[i];
                var cR = e.menu.GetItemByName(item.dx_class),
                    show = ((cR && data.c[i]) || ["dx_prop_row", "dx_new_window_row"].indexOf(item.dx_class) != -1) || false;
                if (item.selector == '._unlock' && r.data('unlock') === false)
                    show = true
                if (cR)
                    cR.SetVisible(!!show);
            }
            InitCommands.call(r, { target: r });
            if (!s.IsRowSelectedOnPage(e.index)) {
                s.UnselectAllRowsOnPage()
                s.SelectItem(e.index, true);
            }
        }
        if (e.objectType == "header")
        {
            var filterRowItem = e.menu.GetItemByName("ShowFilterRow");
            var checked = $(s.GetFilterRow()).is(":visible");
            filterRowItem.SetChecked(checked);
        }
    }


    function InitCommands(e, initEvent) {
        var init = function (args,c,event) {
            var item = (event && event.target) ? $(event.target) : $(event[0]) || null,
                parent = item ? (item.parents('.ToManyLinkedTable').length ?
                    item.parents('.ToManyLinkedTable').first() : item.parents('.global-panel').first().find('.Reference-Commands:first')) : null;

            if (item == null)
                return false;

            if (item.parents('.Grid-Control-Class2').length) {
                InitilizeGrid(item);
                if (CurrentGlobal.GetViewMode() == "Tree")
                    return false;
            }
            var dx = null;
            try {
                var control = eval(c) || null;
                dx = control;
            }
            catch(e){ }
            var _count = (dx && dx["GetSelectedKeysOnPage"]) ? dx["GetSelectedKeysOnPage"]() : 1;
            if (!CurrentGlobal) InitilizeGrid(item);
            if (CurrentGlobal.UseTreeState()) _count = 1;
            hide = function (selector) {
                if (_count.length == 1 || _count === 1) {
                    parent.find(selector).each(function () {
                        if ($(this).parents('._drop_c_menu').length)
                            $(this).parents('li').first().hide();
                        $(this).hide();
                    });
                }
            },
                show = function (selector) {
                    selector += ":hidden";
                    var i = parent.find(selector);
                    if (i.length && dialogHelper.CanShow(i) || initEvent)
                        i.css("display","inline-block")
                };
            for (var x = 0; x < data.c.length; x++) {
                var sel = InitCommands.CommandsOrder[x].selector;
                if (data.c[x])
                    show(sel);
                else {
                    hide(sel);
                }
                show('._prop');
            }

            dialogHelper.ShowDefaultCommands(parent);
            if (CurrentGlobal.UseTreeState())
            {
                var trigger = item.data('canbeparent') ? CurrentGlobal.ShowCommand : CurrentGlobal.HideCommand;
                trigger.call(CurrentGlobal, ('_create'));
            }
        },
    data = $(this).data('init');
        if (!data){
            if(CurrentGrid != null)
                if(CurrentGrid.keys.length == 0)
                    $('.header-panel ._operations ._delete').hide();
            
            return false;
        }
        init(data, data.g || {}, e);
        if (data.u) {
            var control = null; 
            try {
                var item = eval(data.g); control = item;
            } catch (e) { return; }
            InitilizeGrid($(control.mainElement));
            var panel = $(CurrentGlobal.mainElement), grid = CurrentGlobal.Components().Grid;
            panel.find('._user_event').hide(); grid && grid.HideContextEvents();
            for (var i = 0; i < data.u.length; i++) {
                var item = panel.find('._user_event[data-id=' + data.u[i] + ']:first'),
                    style = item.parents('.ad_li_menu,._operations').length ? "block" : "inline-block";
                if (grid)
                    contextItem = grid.GetUserContextItemByID(data.u[i]);
                if (typeof(contextItem) != 'undefined' && contextItem)
                    contextItem.SetVisible(true);
                if (dialogHelper.CanShow(item))
                    item.css({ "display": style });
            }
        }
        else {

        }
    }

    InitCommands.CommandsOrder =
   [{ selector: '.connect_nomen', dx_class: "dx_connect_row" },
    { selector: '._edit_c', dx_class: "dx_edit_row"},
    { selector: '._checkin', dx_class: "dx_accept_row" },
    { selector: '._canc_edit', dx_class: "dx_cancel_row" },
    { selector: '._download', dx_class: "dx_download_row" },
    { selector: '._prop', dx_class: "dx_prop_row" },
    { selector: '._unlock', dx_class: 'dx_unlock_row' },
    { selector: '._new_window', dx_class: 'dx_new_window_row' },
    { selector: '._delete', dx_class: 'nullable' },
    { selector: '._user_event', dx_class: 'nullable' },
  //  { selector: '._moveUp_folder', dx_class: 'nullable' }
        
   ];

var dialogHelper = function (container) {
    (function _OnInit() {
        (function _initButtons() {
            if (!container || typeof (container) == "function")
                return false;

            // var id = container.data('object-data').ObjectId;
            container.removeClass('disablededit');
            control = container.find('.EditDialogButton:first');
            status = container.attr('status');
            InitDiag(container);
            console.log(status);
            switch (status) {
                case 'Blocked':
                    control.remove();
                    container.find('.customDialog-button').hide();
                    container.addClass('disablededit');
                    container.find('.dx_docs_area textarea').attr('disabled', 'disabled');
                    if (!container.parents('.properties-panel').length)
                        container.find('.CancelDialogChangesButton:first').css({ "display": "inline-block" });
                    break;
                case 'Free':
                    EditDialog(control, true)
                    break;
                case 'Editable':
                    container.find('.customDialog-button').hide();
                    container.addClass('disablededit');
                    container.find('.dx_docs_area textarea').attr('disabled', 'disabled');

                    if (!container.parents('.properties-panel').length)
                        container.find('.CancelDialogChangesButton:first').css({ "display": "inline-block" });

                    var table = container.find('.complex_table');
                    if (table.length && table.attr('Status') == "Free") {
                        container.find('.SaveDialogChangesButton:first').css({ "display": "inline-block" });
                }
                    break;
                case 'EditableLinkOpen':
                    container.find('.customDialog-button').hide();
                    container.find('.SaveDialogChangesButton:first').css({ "display": "inline-block" });
                    container.find('.CancelDialogChangesButton:first').css({ "display": "inline-block" });
                    if (container.parents('.complex_table').length) {
                        EditButtons(container.find('.DialogTable:first'))
                }
                    break;
                case 'New':
                    EditButtons(control);
                    break;
        }
        }());
        dialogHelper.initControls(container);
    }());
}

dialogHelper.initControls = function (container) {
    var control_items = container.find('.fixed_value_column, .TableContainerColumn, .ImageColumn').map(function () {
        return {
            height: $(this).data('fixed-height'), width: $(this).data('fixed-width'), self: $(this)//, div: $(this).find('.value_div')
    }
    });
   // for (var i = 0; i < control_items.length; i++) {
    //    control_items[i].self.resizable();
   //     (control_items[i].self).parent().resizable();
    //    if (control_items[i].height) {
    //        control_items[i].div.css({"height": control_items[i].height || 10 + "px" });
    //}
    //    if (control_items[i].width)
    //    {
    //        var prev = control_items[i].self.prev(), next = control_items[i].self.next();
    //        if (prev.length && prev[0].tagName === 'TD') control_items[i].width -= (prev.width() + 4);
    //        if (next.length && next[0].tagName === 'TD') control_items[i].width -= (next.width() + 4);

    //        control_items[i].div.css({ "width": control_items[i].width + "px" });
    //}
//}
    container.find('.commands-control').each(function () {//.ManyTableHeader
        var visibleElems = $(this).find('.CommandButton-Line-Container');

        if ($(this).find('._drop_c_menu').length)
            return;

        $(this).append("<div class='_drop_c_menu'><i class='arrow'></i><ul></ul></div>");
        var menu = $(this).find('._drop_c_menu ul');

        for (var i = 0; i < visibleElems.length; i++) {
            var elem = visibleElems[i].outerHTML;
            menu.append("<li>" + elem + "</li>");
    }
        menu.find('.CommandButton-Line-Container').css({ "display": "inline-block", "opacity": "1" });
    });
    container.find('.TableContainerColumn').each(function () {
        //  $(this).parents('tr').first().height(170);
        $(this).find('.grid-control .dxgvCSD:first').height(100);
    });
//    var _resetEvents = function (content) {
//        content.find('span.selectbox').remove();
//        content.find('select').selectbox();
//}

//    container.find('.ObjectParameters').each(function () {
//        if ($(this).find('.control_row').length == 1)
//            return;

//        var width = Math.max.apply(Math, $(this).find('.control_row')
//            .map(function (x) { return (this.cells.length == 2) ? $(this).find('td:first').width() : 0; }));

//        $(this).find('.control_row').each(function () {
//            var columns = [];
//            for (var i = 0; i < this.cells.length; i++) {
//                if ($(this.cells[i]).hasClass('value_column_')) {// || $(this.cells[i]).hasClass('no-padding-column')) {
//                    columns.push($(this.cells[i]));
//            }
//        }
//            var width = parseInt(100 / columns.length).toString() + "%";
//            for (var a = 0; a < columns.length; a++)
//                if (width !== "100%" && !columns[a].hasClass('fixed_value_column')) {// && !columns[a].hasClass('no-padding-column')) {
//                    //     console.log(columns[a]);
//                    columns[a].attr('style', 'width:' +width);
//        }
//        });

        //var td = $(this).parents('tr').next().find('._resized_table').find('td:first');
        //td.css({ "width": width + "px" });
        //if (td[0] && !td[0].children[0].children.length && width != "1")
        //    td.find('div:first').css({ "width": "inherit" });
   // });
}
dialogHelper.OnResize = function ($elem) {
    if (typeof $elem !== 'undefined' && !($elem instanceof jQuery) && $elem.modal)
        $elem = $($elem.windowElements[-1]);

    var selector = $elem ? $elem.find('.commands-control:visible') : $('.commands-control:visible');
    selector.each(function () {
        var menu = $(this).find('._drop_c_menu');
        InitilizeGrid(menu);
        var selfWidth = $(this).width(),
            visibleElems = $(this).find(".CommandButton-Line-Container:not([class*=' _contr'])");
        visibleElems.hide();
        var ul = $(this).find('#navigation-buttons');
        var ulOffset = ul.offset().left - 45;
        menu.hide(); var canHideDrop = true;
        visibleElems.show();

        // Скрываем недоступные для выбранного объекта команды,
        // и убираем их из калькуляции ширины панели тулбара
        
        if (CurrentGrid)
        {
            var r = CurrentGrid.GetRow(CurrentGrid.cpFocusIndex || 0);
            InitCommands.call(r, { target: r }, false);
            visibleElems = $.makeArray(visibleElems).filter(function (item) {
                return $(item).is(':visible');
            });
        }

        var treeKey = CurrentTree ? CurrentTree.GetFocusedNodeKey() : null;
        if (treeKey == "0") {
            CurrentGlobal.HideCommand('_moveUp_folder');
            visibleElems = visibleElems.filter(function (item) {
                return !$(item).hasClass('_moveUp_folder');
            });
        }

        if (CurrentGlobal.UseTreeState()) {
            if (treeKey == "0")
                InitCommands.CommandsOrder.forEach(function (item) { $(item.selector).hide() });
            var r = CurrentTree.GetRowByNodeKey(treeKey);
            InitCommands.call(r, { target: r }, false);
            var visibleElems = $.makeArray(visibleElems).filter(function (item) {
                return $(item).is(':visible');
            });
        }
        

        // Скрываем, если offset.left + width налагается на команды вида
        for (var i = 0; i < visibleElems.length; i++) {
            var $elem = $(visibleElems[i]);
            $elem.css({ "display": "inline-block" });
            var offset = $elem.offset(),
                resultOffset = offset.left + $elem.width();
            if (resultOffset < ulOffset) {
                canHideDrop && menu.hide();
            }
            else {
                $elem.hide();
                canHideDrop = false;
                menu.show();
            }
        }

        if (!CurrentGrid || !CurrentGrid.cpCallBackArgs)
            return;

        if (!CurrentGrid.GetDataItemCountOnPage()) {
            if (CurrentGlobal.GetViewMode() !== "Grid") return;
            if (!CurrentGlobal.cpLinkTable)
                $(visibleElems).hide();
            dialogHelper.ShowDefaultCommands($(this), false, CurrentGlobal.GetViewMode() !== 'Tree');
        }
    });
}

dialogHelper.CanShow = function (element, force) {
    if (element.length > 1)
        element = $(element[0]);
    var parent = element.parents('.commands-control'),
        elemwidth = element.width();
    if (!parent.length)
        parent = element.parents('.ManyTableHeader');
    var selfWidth = parent.find('.fav_li').length ? parent.width() - 240 : parent.width() -230;
    visibleElems = parent.find('.CommandButton-Line-Container:visible');
    var summWidth = (visibleElems.length !== 0 ? $.makeArray(visibleElems.map(function () { return $(this).width(); })).reduce(function (a, b) {
        return a +b;
    }) : 0) + ( force ? 0 : elemwidth);
    var difference = selfWidth -summWidth;
    if (difference >= 50) {
        parent.find('._drop_c_menu').hide();
        return true;
    }
    else {
        parent.find('._drop_c_menu').show();
        return false;
}

}
Array.prototype.remove = function (value) {
    var idx = this.indexOf(value);
    if (idx != -1) {
        // Второй параметр - число элементов, которые необходимо удалить
        return this.splice(idx, 1);
}
    return false;
}

dialogHelper.ShowDefaultCommands = function (p, drop, hideLinks) {
    var _coms = ['._import', '._delete', '._create', '._addobject', '._remove_link', '._operations', '._reports'];
    if (hideLinks) { _coms.remove('._delete'), _coms.remove('._remove_link')
}
    for (var i = 0; i < _coms.length ; i++) {
        var c = p.find(_coms[i] + ":hidden");
        if (drop) {
            c.show();
            c.parents('li').first().show();
            continue;
    }

        if (c.length && dialogHelper.CanShow(c))
            c.css("display", "inline-block");
}
}
dialogHelper.OnValueChanged = function (s, e, trigger) {
    var json = s["cpParameter"] || {},
    data = typeof json === "string" ? JSON.parse(json) : json,
    value = s.cpCustomData || s.GetValue(),
    parameter = trigger ? null : { "name": value, "ID": data.Id, "GroupID": "" };
    if (!value && s.cpUserControl) {
        s.cpValue = value;
    }
    if (s.cpAllowUnExisted === false && s.GetSelectedIndex() === -1) {
        if (value != null) {
            s.SetIsValid(false); $(s.GetErrorCell()).effect("pulsate", { times: 2 }, 2000);
            return false;
        }
        s.SetIsValid(true);
    };
    if (s.cpComboType) {
       
        parameter.GroupID = parameter.ID;
        var item = s.GetListBoxControl() ? s.GetSelectedItem() : null;
        parameter.ID = item ? item.value : null;
        if (s.cpAsUserControl) 
        {
            parameter.ID = parameter.GroupID;
            value = item.text;
        }
        else
            parameter.Type = "Link";
    }
    if (s.isASPxClientTextEdit && s.jsonData && s.jsonData.guid)
    {
        parameter.Type = "Link";
        parameter.GroupID = s.jsonData.guid;
    }
    var filtersData = dialogHelper.GetFilters($(s.mainElement)),
    postFilters = filtersData.filters.mapped();
    _triggerOthers(s, value);
    _on_value_changed({
        info: parameter, value: value,
        parentId: data.parentId, filters: postFilters
    }, function (response) {
        for (var i = 0; i < filtersData.filters.length; i++) {
            // Валидация фильтров на контролы
            filtersData.controls.forEach(function (item) {
                var show = response.Data.indexOf(i) != -1;
                if (item.cpItemName === filtersData.filters[i].Key)
                    !item.cpLinkTable ? item.SetEnabled(!show)
                        : item.SetControlEnabled(!show);
            });
            // Валидация фильтров на страницы гурппы
            filtersData.validatePageFilters(filtersData.filters[i].Key,response.Data.indexOf(i) != -1);
        }
    });
    function _triggerOthers(ctrl, value) {
        var parent = $(ctrl.mainElement).parents('.DialogTable').first(),
        controls = [];
        parent.find('._table_container').each(function () {
            if (this.controls) {
                this.controls.filter(function (item) {
                    if (item.cpParameter && item.cpParameter == ctrl.cpParameter)
                    {   
                       if(ctrl.cpUserControl)
                       {
                           var data = ctrl.GetValue();
                           item.GetValue = function () { return data; };
                           item.SetText(ctrl.GetInputElement().value);
                       }
                       else
                        item.SetValue(value);
                    }
                });
            }
        });

    }
}

dialogHelper.hideUntilCallback = function (ctrl) {
    var DialogContainer = ctrl.parents('.DynamicDialogContainer').first(),
    prev = DialogContainer.prev();
    prev.find('.blocked_content').length ? void prev.find('.blocked_content').remove() :
              void $('.blocked_content').remove();

    if (!DialogContainer.length && ctrl.hasClass('DynamicDialogContainer'))
        ctrl.hide();

    DialogContainer.hide();

    return {
            control: DialogContainer,
            show: function () {
            $('#pageWrapper').prepend("<div class='blocked_content'></div>");
            $('.blocked_content').animate({
                    opacity: "0.5",
            }, 100);

            this.control.show();
    },
            dispose: function () {
            this.control.remove();
    }
}
}
function OnWorkButtonClick(s,e) {
    var data = JSON.parse(s.cpData);
    switch (s.cpType) {
        case (1):
            ax.post('/WorkingPage/RunMacro/', { guid: data.macroGuid, method: data.method }, function () {
                var container = $(s.mainElement).parents('.InvisibleContainer').first();
                if (container.length)
                {
                    container.append(_loader);
                    ax.post('/WebDialog/GetDialogContent', {
                        showIndicator: false,
                        popOut: !(!!container.parents('.TestPopupclass').length)
                    }, function (data) {
                        container.replaceWith(data.Text);
                    });
                }
            });
            break;
        case (2):
            var control = $('.Key-refer[data-name=' + data.ReferenceControlName + ']');
            if (control.length) {
                InitilizeGrid(control.find('.Reference-Control:first'));
                ax.post('/Commands/UserEvent/',{ Guid: data.EventID,container: CurrentGlobal.GetSelectedKeys() });
            }
            break;
        case (4):
            ax.post('/WorkingPage/GetObjectDialog/',{ referenceGuid: data.referenceGuid,objectGuid: data.objectGuid });
            break;
        case (5):
            var _createObject = function () {
                ax.post('/Commands/GetCreationForm/',{
                    ReferenceData: {
                        ReferenceId: data.referenceId
                    },
                    ClassId: data.classId,
                    rootObjectId: data.objectGuid,
                    macroButton: true
                });
            }
            if (!data.objectGuid)
                return void _createObject();
            ax.post('/WorkingPage/ValidateCreation/',{
                referenceId: data.referenceId,rootGuid: data.objectGuid
            },
                function (response) {
                    var result = response.data;
                    if (result.valid || (result.canCheckOutParent && confirm(result.message)))
                        _createObject();
                });
            break;
        case (3):
            var url = "";
            switch (data.openType) {
                case 1:
                    for (var propName in data) {
                        if (data[propName] === null || data[propName] === undefined || data[propName] == _emptyGuid) {
                            delete data[propName];
                        }
                    }
                    var openData = encodeURIComponent(JSON.stringify(data));
                    url = "/OpenByType?context=" + openData;
                    break;
                case 3:
                    url = "/CheckedOut";
                    break;
                case 8:
                    url = "/RecycleBin";
                    break;
                case 19:
                case 24:
                case 30:
                    url = "/Mail"
                    break;
            }
            
            window.open(url);
            break;
    }
}
    dialogHelper.GetFilters = function (container, igroreControls) {
        var $elem = container.hasClass('InvisibleContainer') ? container : container.parents('.InvisibleContainer').first(),
        data = {
            $elem: $elem, filters: $elem.data('filters'), controls: [], _pageTabs: $elem.find('.PageControl'),
            // Делаем валидацию фильтра для страниц текущей группы диалога
            validatePageFilters: function (key, validate) {
                // Валидация только по integer id страницы ( в противном случае прерываем проверку )
                var n = Math.floor(Number(key));
                if (String(n) !== key && n >= 0)
                    return;
                var changetab = false;
                this._pageTabs.each(function () {
                    if ($(this).data('page-id') == key) {
                        $(this).data('hidden', validate).attr('data-hidden', !validate);
                        if (!validate) {
                            var p = $(this).parents('.GroupContainer').first();
                            p.find('._table_container[data-page-id = ' + $(this).data('page-id') + ']:first').hide();
                            if ($(this).hasClass('Selected-Dialog-Page')) {
                                var item = p.find('.PageControl[data-hidden=false]:first').trigger('click');
                            }
                        }
                    }
                });
            }
        };
        if (!$.isArray(data.filters))
            data.filters = [data.filters];
        if (!igroreControls) {
            $elem.find('._table_container').each(function () {
                data.controls = data.controls.concat(this.controls);
            });
        }
        data.filters.mapped = function () {
            return (this.map(function (item) { if(item) return item.Value; }) || [])
        };
        return data;
    }
    function onDurationCloseUp(s, e) {
        var duration = {
            days: eval(s.name + "days").GetValue() || 0,
            hours: eval(s.name + "hours").GetValue() || 0,
            minutes: eval(s.name + "minutes").GetValue() || 0
        };
        s.cpValue = "0.0." + duration.days + " " + duration.hours  + ":" + duration.minutes + ":0";
        var text = "";
        if (duration.days)
            text += " " + duration.days + " days";
        if (duration.hours)
            text += " " + duration.hours + " hours";
        if (duration.minutes)
            text += " " + duration.minutes + " minutes";
        s.SetText(text);
    }
    function diagResize(s, e) {
        $(window).trigger('resize'); setTimeout(function () { initGrid(); }, 100);
    }
    function OnActiveTabChanged(s, e) {
        if (e.tab.index == 0 || e.tab.loaded)
            return;
        var div = $('#' + s.name + "_C" + e.tab.index + " > div");
        e.tab.loaded = true;
        div.append(_loader);
        ax.post('/WebDialog/GetTabContent/', {
            showIndicator: false,
            tabData: s.cpTabData[e.tab.index], pageTab: s.cpPageTab || false
        }, function (data) {
            div.html(data.Text);
        });
    }
    var diagramHelper = {
        GetFormatter: function (chart) {
            return eval(chart.name + "cbFormat");
        },
        InitializePrintOptions: function (chart) {
            chart.GetPrintOptions().SetSizeMode('Zoom');
        },
        PrintChart: function (chart) {
            this.InitializePrintOptions(chart);
            chart.Print();
        },
        SaveChart: function (chart) {
            this.InitializePrintOptions(chart);
            chart.SaveToDisk(this.GetFormatter(chart).GetValue());
        },
        PreviewChart: function (chart) {
            this.InitializePrintOptions(chart);
            chart.SaveToWindow(this.GetFormatter(chart).GetValue());
        }
    };

    function OnTreeViewExpandedChanged(key, id, del, callback, focusKey) {
        CurrentTree.SetCallBackArguments("AutoExpand", false);
        var structure = CurrentTree.cpStructureMode ? JSON.parse(CurrentTree.cpCallBackArgs).StructureData : null;
        ax.post("/DisplayView/SaveTreeListKeys/", {
            showIndicator: false,
            ReferenceId: id,
            TreeKey: key,
            remove: del,
            focusKey: focusKey,
            structure: structure
        },
            function (data) {
                callback && callback();
            });
    }