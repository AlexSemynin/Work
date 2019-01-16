
var $document = $(document);

function InitContentSplitter(navigation) {
    navigation = navigation || {};
    var container = $('#MainContainer');

    if (!container.length)
        return;
    var leftCookie = get_cookie('nav-left'),
        rightCookie = get_cookie('nav-right');
    var left = (leftCookie || "15") + "%",
        right = (rightCookie || "85") + "%";
    if ($('body').hasClass('mobile_screen'))
    {
        left = "100%";
        right = "0%";
        if (rightCookie > leftCookie) {
            left = "0%;"; right = "100%";
        }
    }
    else
    {
        left = (get_cookie('nav-left') || "15") + "%",
        right = (get_cookie('nav-right') || "85") + "%";
    }
    var settings = {
        width: "100%", height: "100%", showSplitBar: !$('body').hasClass('mobile_screen'), panels: [{ size: left, min: 0 }, { min: 0, size: right }]
    };
    if (container.data('fullscreen') == true || navigation.hideNav) {
        settings = { width: "100%", height: "100%", showSplitBar: false, panels: [{ size: 0, min: 0 }, { min: 0, size: "100%" }]
    };
    }
    $('#Main-Content').jqxSplitter(settings);
    if (right == "100%")
        $('.pre_expand').addClass('visible');

    $('.jqx-splitter-collapse-button-vertical:first').addClass('nav-spl');
    $('.jqx-splitter-splitbar-vertical:first').addClass('nav-cst-spl');
    $('#Main-Content').on('resize', function (event) {
        $("#CatalogueContainer").fadeTo("fast", 1);
        var persent = $('#Main-Content').width() / 100,
         left = $('#CatalogueContainer').width() / persent,
         right = 100 -left;
        set_cookie('nav-left', left, 2020, 12, 15);
        set_cookie('nav-right', right, 2020, 12, 15);
    });
    SplitterEvents(false);
    $(window).trigger('resize');
}

$document.keypress(function (e) {
    if (e.which == 13 && !$(e.target).is("textarea")) // Press Enter
    {
        if (e.target)
            $(e.target).trigger('change');

        $('.SaveDialogChangesButton:last').trigger('click');
        if ($('#CreationDialogClass_PW-1').is(":visible")) { $('#customDialog-button').trigger('click'); }
        if ($('.DynamicDialogContainer').length > 0) { $('#empty-dialog-accept').trigger('click'); }
    }
});
$document.keyup(function (e) {
    if (e.keyCode == 27) {
        $('.CancelDialogChangesButton:last').trigger('click');    // esc
        if ($('#CreationDialogClass_PW-1').is(":visible")) { CreationDialogClass.Hide(); }
        var count = $('.DynamicDialogContainer').length;
        if (count > 0) { $('.CloseDialogButton').trigger('click'); }
    }
    if (e.keyCode == 32) {
        $('.contact-area').each(function () {
            var val = $(this).val().trim(),
           parent = $(this).parents('.Address-To').first();
            if (val != null && val != "") {
                var row = mailService.createCard(val, val, 'InetUser');
                parent.find('textarea:first').before(row);
                $(this).val("");
            }
        });
    }
});
(function ($) {
    $(function () {
        $('select.catalog-list').selectbox();
        $('#add').click(function (e) {
            $(this).parents('div.section').append('<br /><br /><select><option>-- ' + _localMessages.select2 +
                ' --</option><option>' + _localMessages.item +' 1</option><option>' + _localMessages.item +
                ' 2</option><option>' + _localMessages.item +' 3</option><option>' + _localMessages.item +
                ' 4</option><option>' + _localMessages.item +' 5</option></select>');
            $('select').selectbox();
            e.preventDefault();
        })
        $('#add2').click(function (e) {
            var options = '';
            for (i = 1; i <= 5; i++) {
                options += '<option>Option ' + i + '</option>';
            }
            $(this).parents('div.section').find('select').each(function () {
                $(this).append(options);
            })
            $('select').trigger('refresh');
            e.preventDefault();
        })
        $('#che').click(function (e) {
            $(this).parents('div.section').find('option:nth-child(5)').attr('selected', true);
            $('select').trigger('refresh');
            e.preventDefault();
        });
    })
})(jQuery)

// WINDOW RESIZE
$(window).on('resize', function (e) {
    if (e.which == 1)
        return false;
    setTimeout(function () {
        if (typeof(dialogHelper) != 'undefined')
            dialogHelper.OnResize();
        initGrid(false, true);
    }, 200);
})

$document.mouseup(function (e) {
    var container = $(".alt-menu");
    if (!container.is(e.target)
        && container.has(e.target).length === 0) {
        $('.CommandButton-Line-Container').removeClass("Selected-Command");
        container.hide();
    }

    if (!$('._drop_c_menu ul a, ._drop_c_menu, ._drop_c_menu ul i').is(e.target))
        $('._drop_c_menu ul').hide();

    if (!$('#error_information').is(e.target) && !$('.read_more_error').is(e.target) && !$('.stack_trace').is(e.target))
        $('#error_information').fadeOut('fast');

    if (!$('._grid_settings_').is(e.target) && !$('._settings_wrap').is(e.target) && !$('.pagesize_setter').is(e.target))
        $('._settings_wrap').hide();

    var container3 = $("#Upload-form");

    if (!container3.is(e.target)
        && container3.has(e.target).length === 0) {
        $('.CommandButton-Line-Container').removeClass("Selected-Command");
    }
    var cust = $('div.jqx-disableselect');
    if (cust.is(e.target)) {
    }
    var point = $(".my_splitter");
    if (point.is(e.target)) {
        setTimeout(function () {
        }, 600);

    }
    var container4 = $('.Selected-Command');
    if (!container4.is(e.target)  && container4.has(e.target).length === 0) {
        container4.removeClass('Selected-Command');
        $('.view-config-menu').fadeOut('fast');
        $(".ChangeViewBag").fadeOut('fast');
    }
});

$document.on('click', '.read_more_error', function () {
    $('#error_information').fadeToggle('fast');
});

$document.ready(function () {

    $document.on('click', '.d_link', function () {

    });

    $document.arrive(".complex_table", function () {

    });

    $document.arrive('.msg-text', function () {
        $(this).find('style').empty();
    });
 
    $document.on('click', '.reset_link', function () {
        var parent = $(this).parents('ul').first(),
        point = parent.find('.LinkedTextBox:first');
        point.attr("objid", "0");
        point.attr("onclick", "");
        point.val("");
        point.trigger('change');
    });

    $document.arrive('.calendar-control, input[type="date"]', function () {
      //  $(this).datepicker();
    })

    window._is_popout = $('body').hasClass('only_content');

    if (_is_popout) {
        new dialogHelper($('.InvisibleContainer:first'));
    }


    $document.arrive(".InvisibleContainer", function () {
        if (!this.SetScroll) {
            this.SetScroll = function () {
                var helper = new dialogHelper($(this));
                if ($(this).parents('.DynamicDialogContainer').length) {
                    var height = ($(this).height() - 100), body = $('body').height();
                    if (height > body) {
                        $(this).addClass('scrollable_dialog');
                        $(this).find('._table_container').css({ "max-height": (body - 100) + "px" });
                    }
                }
            }.bind(this);
        }
        this.SetScroll();
});

$document.arrive('._table_container', function () {
    var self = $(this), tabs = [];
    this.controls = ASPxClientControl.GetControlCollection().GetControlsByPredicate(function (item) {
        var inside = !!self.has($(item.mainElement)).length;
        if (item.cpTabbedGroup && inside) {
            for (var i = 0; i < item.GetTabCount() ; i++) {
                var tab = item.GetTab(i); tabs.push({
                    cpItemName: tab.name,
                    SetEnabled: function (enabled)
                    { this.SetEnabled(enabled) }.bind(tab)
                });
            }
        }
        return (!!item.cpItemName && inside);
    });
    if (tabs.length)
        this.controls = this.controls.concat(tabs);
});

    $document.on('click', '.box_tree .dxtv-nd', function () {
        $('.box_tree_menu').hide();
        var parent = $(this).parents('.any_link_box').first();
        var point = parent.find('table:first').find('td:first');
        point.html($(this).clone());
    });

    $document.on('click', ' .upl_obj', function () {
        $('.alt-menu').hide();
        var parent = $(this).parents('.TestPopupclass').first();
        mailPoint = parent.find('.attachments-container:first');
        ax.post(ax.links.anyReferenceLink, { IsMailAttachment: true, IsMailElement: false }, function (data) {
            AddDialog(data.Text, 'uplObjParametr');
        });
    });
    $document.on('click', '.upload_el', function () {
        $('.alt-menu').hide();
        var parent = $(this).parents('.mail').first();
        mailPoint = parent.find('.attachments-container:first');
        ax.post(ax.links.anyReferenceLink, { IsMailAttachment: true, IsMailElement: true }, function (data) {
            AddDialog(data.Text, 'uploadElParametr');
        });
    });

    $('._desktop_container').load(function () {
        if($(this).data('type')=="Desktop")
        {
            console.log('checkedout');
            $(this).find('.left-side-splitter').empty();
            $(this).find('.horizontal-split').appendTo($(this).find('.left-side-splitter:first'));
            $('.Splitter-Container').jqxSplitter({ width: "100%", height: "100%", orientation: 'vertical', panels: [{ size: "100%" }] })
        }
    });
    $document.arrive('._desktop_container',function () {
        if ($(this).data('type') == "Desktop") {
            console.log('checkedout');
            $(this).find('.left-side-splitter').empty();
            $(this).find('.horizontal-split').appendTo($(this).find('.left-side-splitter:first'));
            $('.Splitter-Container').jqxSplitter({ width: "100%", height: "100%", orientation: 'vertical', panels: [{ size: "100%" }] });
            $(this).find('.left-side-splitter').css('visibility', 'visible');
        }
    });
    $document.on('click', '.f_bottom ._cancel', function () {
        Filter.Close();
    });
    $document.on('click', '.f_bottom ._ok', function () {
        Filter.SaveChanges();
       // Filter.Close();
    });
    $document.on('click', '.f_bottom ._del', function () {
        Filter.DeleteSelected();
    });
   
    $document.on('click', '.LinkedTableRow', function () {
        CheckSelectedRow($(this));
    });

    $document.on('click', '.flex_custom_drop', function () {
        //$('.flex_drop_content').hide();
        var point = $(this).parents('.selectbox').first().find('.dropdown:first');
        point.fadeToggle('fast');
     
        if ($(this).parents('._f_parameters_list').length != 0) {
         
            if (point.is(':visible')) {
                point.html(Filter.parameters);
            }
            else Filter.Clear();
        }
        $('.flex_drop_content').resizable();
    });

    $document.on('click', '.d_mode', function () {
        InitilizeGrid($(this));
        var pos = null,
            mode = $(this).data('mode');
        var panel = $(this).parents('.global-panel').first(),
        spl = panel.find('.Splitter-Container:first'),
        callbackPanel = eval(panel.attr('id')),
        isTree = callbackPanel.GetViewMode() == "Tree",
        key = CurrentGlobal.GetReferenceData().ReferenceId,//$(this).parents('.Key-refer').first().attr('ref-key');
        left = spl.find('.left-side-splitter:first'),
        right = spl.find('.right-side-splitter:first'),
            reloadPanel = {};
        panel.find('.d_mode .descript').each(function () {
            $(this).removeClass('checkedItem');
        });
        $(this).find('.descript').addClass("checkedItem");
        panel.find('.Reference-Control:first').attr('data-mode', mode);
        panel.find('.global_dx_control:first').attr('data-mode', mode);
        
        switch (mode) {
            case 'Tree':
                OnlyTree = true;
                var lf = panel.find('.horizontal-split:first');
                lf.jqxSplitter({ width: "100%", height: "100%", orientation: 'horizontal', panels: [{ size: "100%" }] });
                var item = panel.find('.panel-opt:first .checkedItem');
                var index = item.parents('li:first').index();
                switch (index) {
                    case 1:
                        pos = 'down'
                        break;
                    case 2:
                        pos = 'right';
                        break;
                }
                spl.jqxSplitter({ width: "100%", height: "100%", panels: [{ size: "100%", min: 0 }, { min: 0, size: "0%" }] });
                if (pos != null)
                    PropPanel(key, $(this), pos);
                left.css('visibility', 'visible');
                reloadPanel = CurrentTree;
                break;
            case 'Grid':
                if (isTree) {
                    var lf = panel.find('.treelist-control:first');
                    lf.jqxSplitter({ width: "100%", height: "100%", orientation: 'horizontal', panels: [{ size: "100%" }] });
                    var item = panel.find('.panel-opt:first .checkedItem');
                    var index = item.parents('li:first').index();
                    switch (index) {
                        case 1:
                            pos = 'down'
                            break;
                        case 2:
                            pos = 'right';
                            break;
                    }
                }
                left.css('visibility', 'hidden');
                spl.jqxSplitter({ width: "100%", height: "100%", showSplitBar: false, panels: [{ size: "0%" }, { size: "100%" }] });
                if (pos != null)
                    PropPanel(key, $(this), pos);
                reloadPanel = CurrentGrid;
                break;
            case 'Explorer':
                if (isTree) {
                    var lf = panel.find('.treelist-control:first');
                    lf.jqxSplitter({ width: "100%", height: "100%", orientation: 'horizontal', panels: [{ size: "100%" }] });
                    var item = panel.find('.panel-opt:first .checkedItem');
                    var index = item.parents('li:first').index();
                    switch (index) {
                        case 1:
                            pos = 'down'
                            break;
                        case 2:
                            pos = 'right';
                            break;
                    }
                }
                panel.find('.Catalog-Manager:first').fadeIn('fast');
                spl.jqxSplitter({ width: "100%", height: "100%", showSplitBar: true, panels: [{ size: "30%", min: 0 }, { min: 0, size: "70%" }] });
                var left = spl.find('.left-side-splitter:first');
                left.css('visibility', 'visible');
                OnlyTree = false;
                if (pos != null)
                    PropPanel(key, $(this), pos);
                reloadPanel = CurrentGlobal;
                break;
            case 'Gantt':

                return false;
        }
        CurrentGlobal.OnViewModeChange();
        ax.post(ax.links.setDisplayMode, { ReferenceId: key, mode: mode },
            function () {
                if (mode == "Explorer")
                {
                    CurrentTree.PerformCallback(); CurrentGrid.PerformCallback();
                    return;
                }
                reloadPanel.PerformCallback();
            },
                  function () { reloadPanel.PerformCallback(); });
        var container4 = $('.view-config-menu');
        $('.hint--top').removeClass('Selected-Command');
        $('.hint--top--custom').removeClass('Selected-Command');
        initGrid();
        $('.view-config-menu').fadeOut('fast'); 
    });


    $document.on('click', '.attachments-container i', function () {
        $.ajax({
            type: "POST",
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            data: JSON.stringify({ name: $(this).prev().text() }),
            url: ax.links.mailRemove,
            success: function (data) {
            },
            error: function (data) {
            }
        });
        var parent = $(this).parents('.attachments-container').first();
        $(this).parents('._att_item').remove();
        if (!parent.find('._att_item').length)
        {
            parent.parents('tr').fadeOut(500, null);
        }
        
    });
    $document.on('click', '.atts_table .default-text', function () {
        var div = $(this).parents('div').first();
       
        div.find('.attachmentrow li').each(function () {
            $(this).find('.active-att:first').removeClass('active-att');
        });
        $(this).addClass('active-att');
        var parent = $(this).parents('.main-m').first();
        var point = $('#' + parent.data('content-id'));
        parent.find('.msg-t-c:first').removeClass('grey_ground');

        point.find('.file-view:visible:first, [data-documents=true]').hide();
        point.find('.msg-text:first').fadeIn('fast');
    });
    $document.on('click', '._filter_row_option', function () {
        var show = null, point = $(this).find('span'), gridName = $(this).data('grid');
        var grid = null, control = null;
        try
        {
          control = eval(gridName);
        }
        catch(e) { return; }
        grid = control;
        var filterRow = $(grid.GetFilterRow());
        if (point.hasClass('checkedItem')) {
            point.removeClass('checkedItem');
            show = false;
            filterRow.addClass('_hidden');//.hide();
        }
        else {
            show = true;
            point.addClass('checkedItem');
            filterRow.removeClass('_hidden');
        }
        var context = grid.cpWinType || $(this).data('context');
        $(grid.mainElement).attr('data-filter', show ? "True" : "False");
        ax.post('/DisplayView/ChangeFilterRow', { showIndicator: false, context: context, show: show });
    });
    $document.on('click', '.att-item', function () {
        var div = $(this).parents('.atts_table').first();
        div.find('.active-att').removeClass('active-att');
        $(this).addClass('active-att');
        var parent = $(this).parents('.main-m').first();
        parent.find('.msg-t-c:first').addClass('grey_ground');
        var point = parent.find('#' + parent.data('content-id'));
        point.find('.msg-text:first, .file-view, [data-documents=true]').hide();
        var container = parent.find('#' + parent.data('content-id')),
        documents = $(this).data('documents'),
        target = documents ?  container.find('[data-documents=true]') : container.find(' > .file-view[data-index=' + $(this).data('index') + ']:first'),
        _onLoaded = function () {
            target.find('.dx_docs_customTab').each(function ()
            { eval($(this).attr('id')).AdjustSize() });
        };
        if (!target.length)
        {
            container.prepend(_loader);
            var id = $(this).parents('.main-m').first().data('item-id');
            ax.post('/Mail/LoadAttachment/', {
                taskId: id, index: $(this).data('index'),
                showIndicator: false, type: container.hasClass('task-text') ? "Tasks" : "Mail",
                documents: documents
            },
                function (data) {
                    container.find('.loaded_pane').remove();
                    container.append(data.Text); _onLoaded
                });
            return;
        }
        _onLoaded();
        target.show();
    });
    $document.on('click', '.box_input', function () {
        $(this).next().trigger('click');
    });



    $('.InvisibleContainer').each(function () {
        var popup = $(this).attr('popout');
        if (popup == "True") {
            $('.headerPane').remove();
            $('.Configuration-Footer').remove();
            $('#MainPage').addClass('popup_page');
        }
    });

    InitDiag(null);

    if (_onlyContent =="True")
        return;




    (function _initNavigation() {
        InitContentSplitter();
    }());
    



    $('#config-menu').on('click', function () {
        if (!$("#menu").is(":visible")) {
            $('#favourites-menu').fadeOut(600, function () {
                $('#config-menu').removeClass('no_bookmark');
                $('#favourites-menu').remove();
                $("#menu").fadeIn(200, null);
                Indicator.hide();
            });


        }
        else {
            $(this).addClass('no_bookmark');
            NProgress.start();
            $.ajax({
                type: "GET",
                contentType: 'application/json; charset=utf-8',
                dataType: 'html',
                cache: false,
                url: ax.links.favourites,
                success: function (data) {
                    $("#menu").fadeOut(200, function () {
                        $('#catalog').append(data);
                        NProgress.done();
                    });
                },
                error: function (data) {
                    NProgress.done();
                }
            });
        }
    });

    var pathArray = window.location.pathname.split('/')
    if (pathArray[1] == "") {
        $('#Frame-Container').fadeIn('fast');
    }
    var width = $(window).width() - $('#CatalogueContainer').width();
    $('#MainContainer').css({ "width": width });
    treeMenu.buildTree('menu');
    CheckBrowserVersion();
    CheckDirectory();
    var width = $('#CatalogueContainer').width();
    $('#mainmenu').css({ "width": width });
    CheckNavigationCookies();
    ResizeTreeView();
    var rows = $('.Reference-row, .work-page-row');
    rows.each(function () {
        var id = $(this).attr("tabindex");
        var parentUrl = "";
        $($(this).parents('.ParentClass').get().reverse()).each(function () {
            parentUrl = parentUrl + '/' + $(this).attr("sourceaddress");
        });
        parentUrl = (parentUrl == "/") ? "" : parentUrl;
        var address = $(this).attr("address");
        var url = address[0] == "/" ? parentUrl + address :
            (parentUrl + '/' + address);
        $(this).find('a:first').attr("href", url);
    });

    $('#menu a').each(function () {
        if ($(this).attr("href") == window.location.pathname) {
            $(this).addClass('active-link');
            var parents = $(this).parents('li');
            parents.each(function () {
                $(this).find('a:first').trigger('click').toggleClass('sub_down');
            });
            return;
        }
    });

    if (!$('#history_entries').has(".Splitter-Container").length)
        $('#MainContainer').fadeIn('slow');
});



// Histoty Api
(function ($) {
    
    var ajaxCallObject = null;
    $(function () {
        if (!History.enabled) {
            return;
        }
        /*  Инициализируем контейнер для записей */
        var $entries = $("#history_entries");

        /* Вешаем обработчики onlick на ссылки */
        var $page_links = $("#CatalogueContainer, .submenu, #CatalogueContainer ul, #CatalogueContainer li");
        History.Adapter.bind(window, "statechange", function () {
            /*  Получаем информацию о состоянии страницы */
            var state = History.getState();
          
            /* Получаем URL нового состояния. Это URL, который мы передали
            в .pushState() */
            var url = state.url;

            /*  Тут можно извлечь дополнительные данные, о которых шла речь выше.
            Например, так: var data = state.data; */

            /*  Отправляем AJAX-запрос на сервер.*/
            var myurl = url + '?AsHistoryApi=true';
            if (ajaxCallObject)
                ajaxCallObject.abort();

            var mobile = $('body').hasClass('mobile_screen');

            ajaxCallObject = $.getJSON(myurl, function (response) {
              //  NProgress.set(0.7);
                if (response.Redirect) {
                    sessionHelper.showModal(function () {
                        window.location = url;
                    });
                }
                !mobile && InitContentSplitter(response.navigation);
                $entries.html(response.Text);
                $("title").text(response.title);
                    $entries.css({ "opacity": "1" });
                    $entries.hide();
                    $entries.fadeIn('slow');
                    initGrid();
                    NProgress.done();

                    if (mobile) {
                        $('#Main-Content').jqxSplitter(
                            { width: "100%", height: "100%", showSplitBar: false, panels: [{ size: "0%", min: 0 }, { min: 0, size: "100%" }] });
                        $(".pre_expand.arrow_hide_menu").addClass("visible");
                    }
            });
        });

        $page_links.delegate("a:not(.static_link,.log_href,#Logoff)", "click", function (e) {
            if (e.originalEvent !== undefined) {
                EnableApi && e.preventDefault();
                var url = $(this).attr("href");
                if ($(this).data('type')) {
                    window.open(url);
                    e.preventDefault();
                    return;
                }
                if (typeof url == 'undefined' || !EnableApi) {
                    $(this).toggleClass('sub_down');
                    return;
                }
                if (window.location.pathname == url)
                    return;
                var img = $(this).find('img');
                if (img.length)
                    $('link[rel="icon"]').attr('href', img.attr('src'));

                NProgress.start();

                $('.active-link, .sel_item').removeClass('active-link, sel_item');

                if (!$(this).hasClass('dx'))
                {
                    $(this).addClass('active-link');
                    systemLinksMenu.DeselectItem(0); systemLinksMenu.DeselectItem(1); systemLinksMenu.DeselectItem(2);
                }

                /*  И сообщаем History.js об изменении состояния страницы
                В качестве первого агрумента можно передать произвольный объект
                с дополнительными данными, которые можно извлечь в обработчике
                изменения состояния, описанном ниже.
                В нашем случае это будет пустой объект. */

                History.pushState({ data: null }, null, url);
                //document.title = _localMessages.loading;
            }
        });
    })
})(jQuery)

$document.on('click', '._f_add', function (e) {
   // Filter.addCondition(e);
    FilterExtension.AddCondition();
    e.preventDefault(); return false;
});
$document.on('click', '._f_del', function (e) {
   // Filter.removeRow(e);
    FilterExtension.DeleteCondition();
    e.preventDefault();
    return false;
});
$document.on('click', '.d-link', function () {
    OpenNewPopup($(this).data('id'), $(this).data('refid'), $(this).data('guid'), $(this).data('source'));
});

function onFilterChange(s, e) {
    if (e.buttonIndex == 0)
        return;
    var value = s.GetSelectedItem().value,
    owner = s.cpOwner;
    if (value === "new" || e.buttonIndex == 1) {
        InitilizeGrid($(s.mainElement));
        FilterExtension.fromTree = (s.cpOwner == "Tree");
        GetCreationForm($(s.mainElement), s.cpClassId, null, s.cpRefId, null, null, true);
    }
    else {
        var component = eval(s.cpGrid),
            useCache = value != "cache" ? false : true;
        component.SetCallBackArguments('UseCacheFilter', useCache);
        component.SetCallBackArguments('FilterId', value)
        try
        {
            if ((s.cpVarBook || []).indexOf(parseInt(value))  != -1) {
            ax.post('/DialogChanges/GetVariables', { id: value }, function (data) {
            });
        }
        else
            component.PerformCallback();
        }
        catch (e) {
           component.PerformCallback();
        }
    }
}
//$document.on('change', '.filter_option_panel select', function () {
//    var filter = $(this).find('option[selected = selected]').val(),
//        owner = $(this).data('owner');
    
//    if (filter == "new")
//    {
//        InitilizeGrid($(this));
//        var refId = $(this).data("filterid");
//        GetCreationForm($(this), $(this).data("filterclass"), refId, $(this).data("id"),null,null,true);
//    }
//    else
//    {
//        var component = eval($(this).data('component')),
//            useCache = filter != "cache" ? false : true;
//        component.SetCallBackArguments('UseCacheFilter',useCache);
//        component.SetCallBackArguments('FilterId', filter)
//        var showVar = $(this).find('option[value=' + filter + ']'),
//        val = showVar.data('run');

//        if (showVar && val)
//        {
//            ax.post('/DialogChanges/GetVariables', { id: filter }, function (data) {
//            });
//        }
//        else
//            component.PerformCallback();
//    }
//});
$document.arrive('select', function () {
    if (!$(this).parents('.gantt_cal_light').length)
    $(this).selectbox();
});
$document.arrive(".dropdown_flex", function () {
    $(this).selectbox();
});


$document.on('click', '.flex_drop_content li', function (e) {
    if ($(this).parents('.av_cols_flex').length == 0) {
        var parent = $(this).parents('.selectbox').first(),
           point = parent.find('.text:first'), type = $(this).data('type'), supportUI = $(this).data('supportui');
        point.text(this.innerText);
        point.attr('data-type', type);
        point.attr('data-supportui', supportUI);
        $(this).parents('.dropdown').hide(),
        id = null, groupId = null;
        switch (type) {
            case ('Equal'):
                id = $(this).data('id') ? $(this).data('id') : $(this).parents('tr').first().find('._f_parameters_list .text:first').data('groupid');
                groupId = $(this).data('groupid');
                break;
            case ("NotEqual"):
                id = $(this).data('id') ? $(this).data('id') : $(this).parents('tr').first().find('._f_parameters_list .text:first').data('groupid');
                groupId = $(this).data('groupid');
                break;
        }
      //  if (!$(this).data('box'))
        if (type == "IsOneOf" || type == "IsNotOneOf")
        {
            Filter.SetValueControl(parent);
        }
        else
        {
            Filter.SetControl(parent, groupId, id);
        }
    }
    else {
        e.preventDefault(); return false;
    }
});

$document.arrive('.av_cols_flex', function () {
   // $(this).parents('._dropdown_data').resizable();
});

$document.on('click', '.arrow_hide_menu', function () {
    var item = $('#Main-Content').find('.jqx-splitter-collapse-button-vertical:first');
    $('.pre_expand').toggleClass('visible');
    $('.jqx-fill-state-pressed:first').toggleClass('pulsate');
    if (!$('#CatalogueContainer').is(':visible') || $('#CatalogueContainer').width() == 0) {
        var sizes = [20, 80];
        if ($('body').hasClass('mobile_screen'))
            sizes = [100, 0];
        set_cookie('nav-left', sizes[0], 2020, 12, 15);
        set_cookie('nav-right', sizes[1], 2020, 12, 15);

        $('#Main-Content').jqxSplitter({
            width: "100%", height: "100%",
            panels: [{ size: sizes[0] + "%", min: 0 },{ min: 0, size: sizes[1] + "%" }]
        });
        $("#CatalogueContainer").fadeTo("fast", 1, function () {});
    }
    else {
        set_cookie('nav-left', "0", 2020, 12, 15);
        set_cookie('nav-right', "100", 2020, 12, 15);
        $('.jqx-fill-state-pressed:first').effect("pulsate", { times: 3 }, 1000);
        $('#Main-Content').jqxSplitter({
            width: "100%", height: "100%",
            showSplitBar: !$('body').hasClass('mobile_screen'),
            panels: [{ size: "0%", min: 0 }, { min: 0, size: "100%" }]
        });
    }
    // ASPxClientControl.RefreshSplitters();
    $('.global-panel').each(function () { $(this).find('.descript.checkedItem').trigger('click'); })
});
$document.arrive('.filter_popup', function () {
   // $(this).find('.filter_content').jqxSplitter({ width: "100%", height: "100%", orientation: 'vertical', panels: [{ size: "60%" }, { size: "40%" }] });
});

$document.on('click', '.list_class_item', function (e) {
    var id = $(this).data('id'), RefId = $(this).data('reference'),
        guid = $(this).parents('.CommandButton-Line-Container').first().data('guid'),
        source = $(this).parents('.CommandButton-Line-Container').first().data('source');
    if (id == "0") {
        $('.alt-menu').fadeOut('fast');
        ShowClassMenu(RefId, $(this), guid, source);
    }
    else {
        GetCreationForm($(this), id, RefId, null, guid, source)
    }
});

$document.on('click', '.m_diag_footer ._ok', function () {
    if ($(this).attr('onclick'))
        return false;

    var parent = $(this).parents('.m_diag').find('table:first'),
        controls = $.makeArray(parent.find('tr').map(function () {
            var valueControl =  $(this).find('.m_text'),
                result =
                {
                    Name: $(this).find('td:eq(0)').text(),
                    ObjectValue : valueHelper.GetData(valueControl),
                    ControlType : valueControl.data('type')
                }
            return result;
        }));
    var dialog = { Name: "", Controls: controls };
    ax.post(ax.links.setMacroValue, { guid: null, value: null, obj: dialog }, function (response) {
    });
    $(this).parents('.Test2Class').first().find('.CloseDialogButton').trigger('click');
});

$document.on('click','.m_diag_footer ._cancel', function () {
    $(this).parents('.Test2Class').first().find('.CloseDialogButton').trigger('click');
});
$document.on('click', '.m_diag .ChangeToOneLink', function () {
    if ($(this).attr('onclick'))
        return false;

    var guid = $(this).data('guid');
    ChangeUserControl($(this),guid, null, null);
});
$document.on('click', '.adr-item', function () {
    $(this).find('.alt-menu:first').show();
});

$document.on('click', '.adr-item .alt-menu li', function () {
    var type = $(this).data('type');
    if (type == 'card')
    {
       
        var id = $(this).parents('.adr-item').data('id'),
        source = $(this).parents('.address_mail_input').first().data('source-id')
        OpenNewPopup(id, { ReferenceId: source });
        $(this).parents('.alt-menu').fadeOut('slow');
        return false;
    }
    $(this).toggleClass('checked_option');
    var items = new Array();
    $(this).parents('ul').first().find('.checked_option').each(function () {
        items.push($(this).data('type'));
    });
    var types =
        (items.length == 2 || !items.length) ? "All" : (items[0] || "internal");
    $(this).parents('.adr-item').data('mail-type', types);
});

$document.on('change', ".DialogTextBox", function (e) {
    if ($(this).parents('.complex_table').length)
        return false;

    var IsClosed = $(this).attr("IsClosed"),
    Value = $(this).val(),
    Id = $(this).attr("ParId");
    if (this.type == "checkbox")
        Value = $(this).is(":checked");
    var parameter = {
        "name": Value, "ID": Id, "GroupID": ""
    };
    $(this).val(Value);
    _on_value_changed({
        info: parameter, ObjectId: $(this).attr('rootobjid'),
        ReferenceId: parseInt($(this).attr('rootrefid')), value: Value
    });
});
$document.on('change', ".LinkedTextBox", function () {

    var parentId = null;

    if ($(this).parents('.complex_table').length)
        parentId = $(this).parents('.ed-link').first().data('parent-id');

    var guid = $(this).attr("guid"),
        RootId = $(this).parents('.InvisibleContainer').first().attr('obj-id');
    id = $(this).attr("objid"),
    refId = parseInt($(this).attr('root-ref-id'));
   var result = null;
    if (id == null)
        id = 0;
    result = $(this).hasClass('UserControl') ? {
        "name": $(this).val(), "ID": $(this).attr('parameter'), "GroupID": ""
    } :
                {
                    Type: "Link", "ID": id, "GroupID": guid
                };
    _on_value_changed({
        info: result, ObjectId: RootId, ReferenceId: refId,value: result.name, parentId : parentId
    });
});
$document.on('change', ".ToManyLinkedTable", function (e) {
    if ($(this).parents('.complex_table').length || e.originalEvent !== undefined)
        return false;

    var table = $(this);

    var guid = table.attr("tabindex"),
    rows = table.find('.LinkedTableRow'),
    RootId = table.attr("root-id"),
    type = table.data('type'),
    refId = table.attr('root-ref-id');
    var TableContainer = new Array();
    rows.each(function () {
        var id = $(this).attr("objid");
        var RefId = $(this).attr("refid");
        TableContainer.push({
            "id": id, "RefId": RefId
        });
    });
    var result = { Type: type,"ID": guid,"GroupID": guid},
        ManyLinks = { "guid": guid, "ReferenceId": refId, "IdContainer": TableContainer};
    _on_value_changed({ info: result, ObjectId: RootId, ReferenceId: refId, manyLinks: ManyLinks, value: null });
});


function _on_value_changed(data,afterCallBack) {
    if (!data.info)
        data.showIndicator = false;
    ax.post(ax.links.OnParameterChanged, data, function (response) {
     //   if (response)
        //   buildDialog(response);
        afterCallBack && afterCallBack(response);
    });
}

function _initDialogEvents() {

}

$document.ready(function () {
    //_initDialogEvents();
})
$document.on('click', '._grid_settings_', function () {
    $(this).find('._settings_wrap').fadeIn('fast');
  //  _settings_wrap
});
$document.on('change', ".page_setter", function () {
    var grid = eval(this.dataset.grid), page = $(this).val(), max = this.dataset.max;
    if (parseInt(page) > parseInt(max)) {
        page = max;
    }
    grid.SetCallBackArguments('CurrentPage', page);
   // new myGrid(grid).SetPage(page);
    grid.PerformCallback();
});

$document.on('click', "._page_int", function () {
    if ($(this).hasClass('_next_p') || $(this).hasClass('_prev_p'))
        return false;
    var grid = eval($(this).parents('.page_count').first().data('grid')), page = $(this).text();
    grid.SetCallBackArguments('CurrentPage', page);
    grid.PerformCallback();
});

$document.on('click', '.reset_button', function () {
    var node = AllReferencesTree.GetSelectedNode();
    ax.post('/DisplayView/ResetReferenceSettings', { context: node.name });
});
$document.on('change', '.pagesize_setter', function () {
    var val = $(this).val(), grid = eval($(this).data('grid')),
        all = false;
    InitilizeGrid($(this));
    if (val == "all") {
        all = true;
        val = 0;
    }
    ReferenceId = grid.GetCallBackArguments().ReferenceData.ReferenceId;
        ax.post('/DisplayView/SetPageSize', { ReferenceId: ReferenceId, value: val, all: all }, function () {
            //eval(grid).PerformCallback();
          
            CurrentGlobal.PerformCallback();
        });
});
var ink, d, x, y;
$document.on('dblclick', '.global_dx_control  .Grid-Row-Class2', function (e) {
    e.preventDefault();
    var p = $(this).parents('.global_dx_control');
    var popupParent = p.parents('.Test2Class').first();
    if (popupParent.length)
    {
        popupParent.find('.dx_command_btn:eq(0)').trigger('click');
        return;
    }
    var type =  p.data('double-click-action') || "OpenDialog";
    switch (type) {
        case ('OpenDialog'):
            $(CurrentGlobal.mainElement).find('._prop:first .CommandButton').trigger('click');
            break;
        case ('OpenInNewWindow'):
            $(CurrentGlobal.mainElement).find('._new_window:first .CommandButton').trigger('click');
            break;
        case ('GoLevelDown'):
            var id = $(this).data('id');
            var tree = CurrentGlobal.Components().Tree,
                grid = CurrentGlobal.Components().Grid;
            var key = tree.GetFocusedNodeKey();
            var state = tree.GetNodeState(key);
            var path = tree.GetFocusedPath(); path.push(id);
            grid.SetCallBackArguments("RootObjectPath", path);
            if (state === "Collapsed") {
                var expandId = EncodeKey(key),
                    referenceId = CurrentGlobal.GetReferenceData().ReferenceId;
                grid.SetCallBackArguments('TreeFolderKey', id);
                tree.SetCallBackArguments('TreeFolderKey', id);
                grid.PerformCallback();
                tree.PerformCallback();
            }
            else {
                grid.SetCallBackArguments("TreeFolderKey", id);
                tree.SetCallBackArguments('TreeFolderKey', id);
                grid.PerformCallback();
                var row = $(tree.mainElement).find('.tree_cell_row[data-id=' + id + ']');
                if (row.length) {
                    if (row.length > 1) {
                        var parent = EncodeKey(key);
                        row = row.filter(function () { return $(this).data('parent-id') == parent });
                    }
                    nodeKey = tree.GetNodeKeyByRow(row[0]);
                    tree.SetFocusedNodeKey(nodeKey);
                    tree.GetScrollHelper().SetVertScrollPosition(row.position().top);
                }
                else {
                    tree.PerformCallback();
                }
            }
            grid.TriggerObjectCommand(id, '_moveUp_folder');
            break;
    }
});

$document.on('click', '.list_f_commands .CommandButton-Line-Container', function () {
    console.log($(this).index());
    var parent = $(this).parents('.filter_list'),
    table = parent.find('table:first'),
    row = $(this).parents('._condition_row').first();
    switch ($(this).index()) {
        case (0):
            var Operator = row.find('._f_operators .text:first'),
            Parameter = row.find('._f_parameters_list .text:first'),
            ui = Operator[0].dataset.supportui, data = Filter.GetParameterData($(this)),
            id = data.groupid ? data.groupid : data.id;
            inner = ui == "true" ? Filter.Controls._link(id) : "<input class='text' type='text'>";
            if (id == _linkIdentity)
            {
                // записываем Guid если это связь
                var groupid = Parameter.data('groupid')
                inner = Filter.Controls._link(groupid);
            }
            table.append("<tr><td>" + inner + "</td></tr>");
            table.find('tr:last input:first').animate({
                backgroundColor: "#FFF38A",
            }, 800).animate({
                backgroundColor: "white",
            }, 800);
            break;
        case (1):
            table.find('.active_input').parents('tr').first().remove();
            break;
}
});
$document.on('click', '.f_values_div input', function (e) {
    $('.active_input').removeClass('active_input');
    $(this).attr('style', '');
    $(this).addClass('active_input');
});
$document.on('change', '.p_variables', function (e) {
    //alert($(this).val());
});
$document.on('click', '.clear-one-link', function (e) {
    if ($(this).attr('onclick'))
        return false;

    var text = $(this).parents('.ed-link').first().find('.text:first');
    text.data('guid','').text('').val('');
});
$document.on('click', '.search_filters_button', function () {
    InitilizeGrid($(this)); 
    var parent = $(this).parents('.global-panel').first(),
        panel = parent.find('.filter_option_panel:first'),
        span = $(this).find('span:first');
   // span.toggleClass('Selected-Command');
    parent.toggleClass('_showed_filter');
    parent.find('.filter_option_panel').toggle();
    var show = panel.is(':visible');
    if (show)
        span.addClass('Selected-Command')
    else 
        span.removeClass('Selected-Command')
    $(window).trigger('resize');
    var mode = CurrentGlobal.GetViewMode(),
    c = mode == "Tree" ? '_filter_mode_tree' : (mode == "Grid" ? '_filter_mode_grid' : '');
    panel.removeClass('_filter_mode_tree').removeClass('_filter_mode_grid');
    panel.addClass(c);
    ax.post('/DisplayView/SavePanel', { show: show });
});


$document.on('mouseover', '.panel-line', function () {
    $(this).prev().fadeIn('fast');
    $(this).prev().show();
});

$document.on('click', '.LinkedRowLine, .Grid-Row-Class2, .tree_cell_row', function (e, initEvent) {
    InitCommands.call(this, e, initEvent); 
});
$document.on('click', '.desktop_grid_table_inner .Grid-Row-Class2', function (e, initEvent) {
    e.preventDefault();
});
$document.on('click', '._user_event', function () {
    if ($(this).parents('.alt-menu').length)
        $(this).parents('.alt-menu').hide();
    InitilizeGrid($(this));
    var refid, container;
    if ($(this).parents('.EditButtons').length) {
        var data = $(this).parents('.InvisibleContainer').first().data('object-data');
        refid = data.referenceId;
        container = [data.id];
    }
    else {
        refid = CurrentGlobal["cpReferenceId"];
        container = CurrentGlobal.GetSelectedKeys();
    }
    ax.post('/Commands/UserEvent/', { Guid: $(this).data('guid'), ReferenceId: refid, container: container });
});

$document.on('click', '._drop_c_menu', function (e) {

    if ($(e.target).hasClass('selection-arrow') || $(e.target).parents('.selection-arrow').length || $(e.target).parents('.CommandButton-Line-Container').length)
        return false;
    var comClass = '.CommandButton-Line-Container',
        self = $(this);
    $(this).find('ul:first').fadeToggle();

    // if (CurrentGrid && !CurrentGrid.GetDataItemCountOnPage()) {
    //     $(this).find('li').hide();
    //     dialogHelper.ShowDefaultCommands($(this),true);
    //     return;
    // }

    $(this).find(comClass).show();
    $(this).find('li').show();
    var parent = ($(this).parents('.commands-control') || $(this).parents('.ManyTableHeader')).first(),
        hideClasses = $.makeArray(parent.find(comClass).filter(function () {
            return (this.classList.length > 1 && $(this).is(':visible') && !$(this).parents('._drop_c_menu').length);
        }).map(function () {
            var selector = this.classList[1];
            if (selector === '_user_event') { return { guid: this.dataset.guid } }
            return this.classList[1];
        }));
    for (var i = 0; i <= hideClasses.length -1 ; i++) {
        var item = hideClasses[i];
        if (typeof(item) != "string") {
            self.find('[data-guid=' + item.guid + ']').parents('li').first().hide();
            continue;
        }
        self.find('.' + item).parents('li').first().hide();
    }
    InitilizeGrid($(this));
   // if (CurrentGlobal.isASPxClientControl) 
    //    $(CurrentGlobal.mainElement).find("tr[data-id='" + CurrentGlobal.GetSelectedKey() + "']").trigger('click');
});
$document.on('click', '._popup_link_', function (e) {
    InitilizeGrid($(this));
    var id = $(this).parents('tr').first().data('id'),
        refid = CurrentGlobal["cpReferenceId"];
    e.preventDefault();
    if ($(this).parents('.Desktopcontainer').length)
    {
        ax.post('/Desktop/GetDialog/', { type: CurrentGlobal.cpWinType, key: CurrentGrid.GetSelectedKeysOnPage()[0] || '' }, function (data) {
            AddDialog(data.Text);
        });
        return false;
    }
    OpenNewPopup(id, refid);
    return false;
});

var importPoint = {};

$document.on('click', '._import', function (e,init) {
    if ($(this).parents('.TableContainerColumn').length || $(this).hasClass('dxeButton')) {
        if (e.data || init)
            return;

        var form = $(this).find('form:first'),
         url = form.attr('action'),
         linkGuid = form.data('guid') || null;
        if (url.indexOf("FolderId") == -1) {
            importPoint = $(this).find('input[type=file]:first');
            ax.post('/FileReference/Folders/', { linkGuid: linkGuid }, function () { });
            e.preventDefault();
        }
        else {
            InitilizeGrid(form);
            form.data('loaded', true);
        }
    } 
});

$document.on('change', ':file:not(.dxTI)', function (e) {
    var point = $(this).next();
    window.xhr = new XMLHttpRequest();
    var data = new FormData();
    var files = this.files;
    for (var i = 0; i < files.length; i++) {
        data.append("PostedFiles", files[i]);
    }
    var target = $(".meter > span"),
    percents = target.next(),
    statusTarget = target.prev();
    statusTarget.text(_localMessages.progress.wait);
    percents.text("0%");
    $('#progess_bar_custom').fadeIn('fast');
    $('.meter a.xhr_abort').removeClass('locked');
    xhr.upload.addEventListener("progress", function (evt) {
        if (evt.lengthComputable) {
            var progress = Math.round(evt.loaded * 100 / evt.total);
            if (progress == 100) {
                $('.meter a.xhr_abort').addClass('locked');
                progress = 99;
                statusTarget.text(_localMessages.progress.saving);
            }
                target.animate({width: progress + "%"}, 0);
                percents.text(progress + "%");
        }
    }, false);
    var url = $(this.parentElement).attr('action');
    InitilizeGrid($(this));
    xhr.open("POST", url);
    xhr.onload = function (e, data) {
        $(':file').each(function () {
            this.value = "";
        });
        if (e.currentTarget.status == "500") {
            alert(e.currentTarget.response);
        }
        else {
            var res = JSON.parse(e.currentTarget.response);
            if (res.data && res.data.src) {
                var img = $('img[id=' + point.data('name') + ']:first');
              
                img.attr('src', res.data.src);
                img.parents('a').first().attr('href', res.data.src).data('_lighter', null);
                setTimeout(function () {
                    img.css({ 'max-height': img[0].naturalHeight + 'px', 'max-width': img[0].naturalWidth + 'px' });
                }, 500);
              
            }
            else {
                if (!res.IsValid && !res.Success) {
                    $('#progess_bar_custom').hide();
                    ShowError(res.Message || res.Text);
                }
                else {
                    target.animate({ width: "100%" }, 0); percents.text("100%");
                    statusTarget.text(_localMessages.uploadComplete);
                    setTimeout(function () {
                        if (res.IsMail)
                            UploadMailAttachment(res);
                        else {
                            if (res.hasMacroContent) {
                                buildDialog(res);
                                return;
                            }
                            if (res.jsContext && res.jsContext.linkData)
                                valueHelper.ReloadOneLink(res.jsContext);
                            else {
                                CurrentGlobal.RefreshControl();
                            }
                        }
                    }, 900);
                }
            }
        }
        setTimeout(function () {
            $('#progess_bar_custom, progess_bar_custom p').fadeOut('fast');
        }, 500);
    }
    xhr.send(data);
    e.preventDefault();
});

$document.on('resize', '.horizontal-split', function (event) {
    if(event.owner)
        dialogHelper.OnResize();

    initGrid();
});
$document.on('click', '.CAD_show_button', function () {
    var p = $(this).parents('tr').first().prev().find('div:first');
    p.append(_loader); var frame = p.find('.cad_frame');
    frame.attr('src', frame.data('path') + '?iframe=true');
    frame.on('load', function () {
      $(this).parents('.wrap_iframe').first().find('.loaded_pane').remove();
        
    });

});

$document.on('load', '.cad_frame', function () {
});

$document.on('mouseleave','.Working_Grid',function (e) { 
    if(ASPx.currentDragHelper)
    {
        var dragger = ASPx.currentDragHelper;
        if (!ASPx.currentDragHelper.processed) {
            $(dragger.dragObj).on('mouseup',function (evt) {
                if (!dragger.targetElement)
                    dragger.grid.HideColumnInternal(window.dragerColumn);
            });
        }
        ASPx.currentDragHelper.processed = true;
    }
});

$document.on('dblclick', '.dx_gridview_header', function (e) {
    if ($(this).css('cursor') === "w-resize") {
         var table = $(window.resizedGrid.GetMainTable());
         var source = window.resizedGrid.GetWidth();
        var header = table.parents().first().prev().find('.dx_gridview_table:first');
        var tr = table.find('tr:first')[0];
        var style = table.attr('style');
        var newStyle = style + " table-layout: auto";
        table.css({ "table-layout": "auto" });
        header.css({ "table-layout": "auto" });
        var tr = table.find('tr:first')[0];
        var headertr = header.find('tr:first')[0];
        var widths = [];
        for (var i = 2; i < tr.cells.length; i++) {
            widths.push($(tr.cells[i]).attr('style'));
        }
        header.css({ "table-layout": "fixed" });
        var next = $(tr).next()[0];
        var newWidth = $(next).width();
        if (newWidth <= source) {
            for (var i = 2; i < next.cells.length; i++) {
                var width = next.cells[i].scrollWidth + 1;
                $(tr.cells[i]).css({ "width": width + "px" });
                $(headertr.cells[i]).css({ "width": width + "px" });
            }
        }
        table.css({ "table-layout": "fixed" });
        delete window.resizedGrid;
    }
});

$document.on('keyup', '.contact-area', function (e) {
    var str = $(this).val().replace(/(\r\n|\n|\r)/gm, "");
    var menu = $(this).next();
    if (window.axStarted || str == '') {
        menu.hide();
        return false;
    }
    switch(e.which)
    {
        case (38):
            event.preventDefault();
            var item = menu.find('.actived');
            item.removeClass('actived');
            item.prev().addClass('actived');
            if (!item.prev().length) {
                menu.find('li:last').addClass('actived');
            }
            return false;
        case (40):
            event.preventDefault();
            var item = menu.find('.actived');

            item.removeClass('actived');
            item.next().addClass('actived');
            if (!item.next().length) {
                menu.find('li:first').addClass('actived');
            }
            return false;
        case (13):
            mailService.addContact({ target: menu.find('.actived:first') }, menu);
            return false;
    }

    setTimeout(function () {
        window.axStarted = 1;
        ax.post('/UserReference/GetUsers/', { str: str }, function (response) {
            window.axStarted = 0;
            if(response.data)
              menu.show();
            menu.empty();
            for (var i = 0; i < response.data.length; i++)
                menu.append("<li data-id=" + response.data[i].id + "><img src='" + response.data[i].icon + "'/>" + response.data[i].name + "</li>");
            if (!response.data || !response.data.length)
                menu.hide();
        }, function () { window.axStarted = 0});
    }, 100);
});
$document.on('click', '.mail_dropdown_list li', function (e) {
    if (e.target.tagName.toLowerCase() === 'img')
        e.target = $(e.target).parent()[0];
    mailService.addContact(e);
});
$document.ready(function (e) {
    var color = $('#CatalogueContainer').css('background');
    $('.jqx-fill-state-normal').css({ "background": color});
    $document.arrive(".jqx-fill-state-normal", function () {
        $(this).css({ "background": color});
    });
});
$document.arrive('.biClass', function () {
    $(this)
        .attr("src", $(this).attr("src"))
        .load(function () {
            var self = $(this);
            self.css({ "max-width": this.width + "px" });
            self.css({ "max-height": this.height + "px" });
            self.addClass('image_fHeight')
        });
});
$document.arrive('.lighter_container', function () {
    $(this).attr('href', $(this).find('img:first').attr('src'));
});
$document.on('click', '.all_children_btn', function () {
    $(this).toggleClass('checkedItem');
    var all = $(this).hasClass('checkedItem'),
        grid = eval($(this).data('grid'));
    ax.post('/DisplayView/ShowAllChildren', { showIndicator: false, all: all }, function () {
        grid.PerformCallback();
    });
});
$document.on('click', '.TreeListButton', function () { InitilizeGrid($(this)) });
$document.on('click', '#new_mail_notifier i', function () {
    $('#new_mail_notifier').remove();
});
$document.on('click', '#new_mail_notifier span+span', function () {
    var point = $('#new_mail_notifier');
    ax.post('/Mail/OpenItem', { GlobalId: point.data('id'), IsMail: point.data('mail') }, function (data) {
        $('#new_mail_notifier').remove();
        AddDialog(data.Text);
        InitPopupMenuHandler(dxAttachmentPopup); 
    });
    point.slideUp(300, function () { point.remove() });
});
$document.on('click', '.dx_group_exp_btn', function () {
     $(this).text($(this).text() == "+" ? "-" : "+");
    $(this).parents().first().next().toggle();
});
$document.on('click','.h_f_item',function(){
    if ($(this).parent().index() == 0) {
        var grid = eval($(this).parents('.Grid-Control-Class2').attr('id'));
        grid.SetCallBackArguments("UserFilter", null);
        grid.PerformCallback();
    }
});
$document.arrive(".dx_modal_background", function () {
    if ($(this).prev()) {
        $(this).insertBefore($(this).parent());
    }
});
$document.arrive('.docs_value_container',function () { 
    if ($(this).hasClass('jqx-widget'))
        return;
    $(this).jqxSplitter({
        width: "1000px",height: "430px",showSplitBar: true,
        panels: [{ size: "50%",min: 0 },{ min: 0,size: "50%" }]
    });
})
$document.on('click','._condition_row',function () { 
    if ($(this).hasClass('condition_selected'))
        return;
    $('.condition_selected').removeClass('condition_selected');
    $(this).addClass('condition_selected');
}); 
$document.on('click', '.diagram_toolbar button', function () {
    var control = eval($(this).parent().data('name')),
    img = $(control.mainElement).find('img:first'),
    size = { height: img.height(), width: img.width() };
    switch ($(this).index()) {
        case 0: 
            control.PerformCallback({ "height": size.height + 25, "width": size.width + 50 });
            break;
        case 1: 
            control.PerformCallback({ "height": size.height - 25, "width": size.width - 50 });
            break;
        case 2:
            var parent = $(this).parents('td').first();
            control.PerformCallback({ "height": parent.height() - 50, "width": parent.width() - 20 });
            break;       
    }  
});
$document.on('click', '.link_button_editor input', function (e) {
    var parent = $(this).parents('.link_button_editor').first();
    var control = eval(parent.attr('id'));
    if (control.GetText() == control.cpNullText)
        control.ButtonClick.FireEvent(control, { buttonIndex: 0 })
});
$document.arrive('a._parameters_node', function () {
    $(this).attr('href', 'javascript:void(0)');
});
$document.on("dblclick", ".dx_row_focused[data-id='0'], .tree_cell_row[data-id='0']", function (e) {
    if (CurrentTree.GetNodeState("0") == "Expanded")
        CurrentTree.CollapseNode("0");
    else
        CurrentTree.ExpandNode("0");

}); $document.on('click', '.TreelistDynamic .grid_com_col', function (e) {
    InitilizeGrid($(this));
    CurrentTree.OnHeaderClick(e.target.parentNode);
});
// $(document).arrive('#pcViewSettings_T1', function () {
//     var p = $(this).parents('.Test2Class');
//     if (p.length) {
//         p.find(".dxpc-contentWrapper").addClass('StyleClassHeight1');
//         p.find(".TestPopupclass").children().addClass('StyleClassHeight2');
//         p.find("#VisibleColumns_D").attr("style", "height: 380px; overflow: hidden auto;")
//     }
// });
$document.on('click', '.SettingsWindowPageProperty #pcViewSettings_T1T', function(){
    $('.SettingsWindowPageProperty').addClass('StyleClassWidth1');
    $('.SettingsWindowPageProperty').removeClass('StyleClassWidth2');
})
$document.on('click', '.SettingsWindowPageProperty #pcViewSettings_T0T', function(){
    $('.SettingsWindowPageProperty').addClass('StyleClassWidth2');
    $('.SettingsWindowPageProperty').removeClass('StyleClassWidth1');
})