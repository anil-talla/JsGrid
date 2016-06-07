(function (Grid) {
    var PrepareGrid = (function () {
        var CreateInstance = function (config) {
            var _this = {};
            var _con = {
                pages: [10, 25, 50, 100],
                pageSize: 10,
                currentPage: 1,
                server: false
            };
            _this.gridId = config['id'] || "";
            _this.fixedHeader = config['fixedHeader'] || false;
            _this.editable = config['editable'] || false;
            _this.multiselect = config['multiselect'] || false;
            _this.columns = (function () {
                var columns = [];
                columns = config['columns'] || [];
                if ((config['data'] || []).length && columns.length == 0) {
                    columns = Object.keys(config['data'][0]);
                }
                return columns;
            })(); 
            _this.data = config['data'] || [];
            _this.dropdowns = config['dropdowns'] || [];
            _this.toolbar = config['toolbar'] || [];
            _this.pageSetting = {
                pageSize: _con.pageSize,
                currentPage: _con.currentPage,
                pages: _con.pages,
                server: _con.server,
                totalPages: _con.currentPage
            };
            _this.pagination = (function () {
                var settings = config['pagination'] || config['pageSize'];
                if (settings && settings != {}) {
                    if (isNaN(settings)) {
                        if (settings == true) {
                            _this.pageSetting = {
                                pageSize: _con.pageSize,
                                currentPage: _con.currentPage,
                                pages: _con.pages,
                                server: _con.server
                            }
                        }
                        else {
                            _this.pageSetting = {
                                pageSize: settings['pageSize'] || _con.pageSize,
                                currentPage: _con.currentPage,
                                pages: settings['pages'] || _con.pages,
                                server: settings['server'] || _con.server
                            }
                        }
                    }
                    else {
                        _this.pageSetting = {
                            pageSize: settings,
                            currentPage: _con.currentPage,
                            pages: _con.pages,
                            server: _con.server
                        }
                    }
                    _this.pageSetting.totalPages = Math.ceil(_this.data.length / _this.pageSetting.pageSize)
                    return true;
                }
                return false;
            })();
            return _this;
        };
        var gridRef = '';
        function JsGrid(config) {
            var _this = this;
            if (!config) {
                config = {};
            }
            _this.config = CreateInstance(config);
            _this.prepareGrid();
            gridRef = _this;
            return {
                getSelectedRows : JsGrid.getSelectedRows
            }
        }
        JsGrid.prototype.createElement = function (tagName) {
            return document.createElement(tagName);
        }
        JsGrid.prototype.createCell = function (column,data) {
            var _this = this, html = false;
            var _cell = _this.createElement('td');
            var value = data;
            if(typeof column['template'] == 'function'){
                value = column['template'](value);
                html = /^<.*>.*<\/.*>$/.test(value);
            }
            else {
                if (column['type'] == 'currency') {
                    if(column['currency']){
                        if (column['position'] == 'left') {
                            value = column['currency'] +  value;
                        }
                        else {
                            value += column['currency'];
                        }
                    }
                }
                else if (column['type'] == 'dropdown') {
                    var record = (_this.config.dropdowns || []).find(function (obj) { return obj['fieldname'] == column['fieldname'] }) || {};
                    if(record.hasOwnProperty('values')){
                        var matchRecord = (record['values'] || []).find(function (obj) { return obj['value'] == value; }) || {};
                        if (matchRecord) {
                            _cell.originalValue = value;
                            value = matchRecord['name'] || value;
                        }
                    }
                }
            }
            if(html){
                _cell.innerHTML = value;
            }
            else {
                _cell.textContent = value;
            }
            _cell.className = 'jsGrid-table-cell'
            return _cell;
        }
        JsGrid.prototype.prepareGrid = function () {
            var _this = this;
            if (!_this.gridElement) {
                if (_this.config.gridId) {
                    _this.gridElement = document.querySelector('[id=' + _this.config.gridId + ']');
                }
                else {
                    _this.gridElement = document.querySelector('[data-grid]');
                }
            }
            else {
                _this.gridElement.innerHTML = '';
            }
            _this.isAllSelected = false;
            var _rootDiv = _this.createElement('div');
            _rootDiv.className = 'JsGrid';
            _rootDiv.id = _this.config.gridId + '--JsGrid';
            if(_this.config.columns.length == 0){
                return false;
            }
            if (_this.config.toolbar.length || true) {
                var toolbar = _this.prepareToolbar();
                toolbar.id = _this.config.gridId + '--toolbar';
                _rootDiv.appendChild(toolbar);
            }
            var table = _this.prepareTable();
            table.id = _this.config.gridId + '--table';
            _rootDiv.appendChild(table);
            if(_this.config.pagination){
                var paging = _this.preparePaging();
                paging.id = _this.config.gridId + '--paging';
                _rootDiv.appendChild(paging);
            }
            _this.gridElement.appendChild(_rootDiv);
        }
        JsGrid.prototype.prepareTable = function () {
            var _this = this;
            var rootTable = _this.createElement('div');
            rootTable.className = 'JsGrid-table table-responsive';
            var _table = _this.createElement('table');
            _table.className = 'table table-striped table-bordered table-hover';
            var columns = _this.prepareColumns();
            _table.appendChild(columns);
            _this.copyData = _this.config.data;
            var data = _this.prepareData(_this.copyData);
            _table.appendChild(data);
            if (_this.config.fixedHeader) {
                rootTable.addEventListener('scroll', function () {
                    var thead = this.querySelector('thead');
                    thead.style.top = this.scrollTop + 'px';
                    if (this.scrollTop > 10) {
                        //if (!this.removeClass) {
                        thead.className = 'jsGrid-fixedHeader';
                        var dataTds = this.querySelectorAll('tbody tr:first-child td');
                        var headColumns = thead.querySelectorAll('th');
                        for (var _i = 0; _i < headColumns.length; _i++) {
                            if (dataTds[_i].offsetWidth > headColumns[_i].offsetWidth) {
                                headColumns[_i].style.width = dataTds[_i].offsetWidth + 'px';
                            }
                            else {
                                dataTds[_i].style.width = headColumns[_i].offsetWidth + 'px';
                            }
                        }
                        //    this.removeClass = true;
                        //}                    
                    }
                    else {
                        //this.removeClass = false;
                        thead.className = '';
                    }
                });
            }            
            rootTable.appendChild(_table);
            return rootTable;
        }
        JsGrid.prototype.prepareColumns = function () {
            var _this = this;
            var _thead = this.createElement('thead');
            var _tr = this.createElement('tr'), _th;
            if(_this.config.multiselect){
                _th = _this.createElement('th');
                var checkBox = _this.createElement('input');
                checkBox.type = "checkbox";
                checkBox.className = 'jsGrid--root-checkbox';
                checkBox.addEventListener('change', function () {
                    var className = 'jsGrid--checkbox';
                    if (_this.isAllSelected) {
                        className += ' checked';
                    }
                    var checkboxs = _this.gridElement.querySelectorAll('[class="'+ className +'"]');
                    _this.isAllSelected = this.checked;
                    for (var _i = 0; _i < checkboxs.length; _i++){
                        checkboxs[_i].checked = _this.isAllSelected;
                        className = 'jsGrid--checkbox';
                        if (_this.isAllSelected) {
                            className += ' checked';
                        }
                        checkboxs[_i].className = className;
                    }
                });
                _th.appendChild(checkBox);
                _tr.appendChild(_th);
            }
            _this.config.columns.forEach(function (column) {
                _th = _this.createElement('th');
                var columnName = column['label'] || column['fieldname'] || column;
                _th.textContent = columnName;
                if(column['sort']){
                    _th.className = 'sorting';
                    _th.sort = 0;
                    _th.addEventListener('click', function () {
                        var span = this.querySelector('span');
                        if(!span){
                            span = _this.createElement('span');
                            this.appendChild(span);
                        }
                        if(this.sort == 0){
                            span.className = 'fa fa-angle-down';
                            this.sort = -1;
                        }
                        else if (this.sort == -1) {
                            span.className = 'fa fa-angle-up';
                            this.sort = 1;
                        }
                        else {
                            span.className = '';
                            this.sort = 0;
                        }
                        if(this.sort == 0){
                            _this.copyData = _this.config.data;
                        }
                        else {
                            var $f, $s;
                            var sort = this.sort;
                            _this.copyData.sort(function (s, t) {
                                $f = s[columnName];
                                $s = t[columnName];
                                if (isNaN($f)) {
                                    $f = $f.toUpperCase();
                                    $s = $s.toUpperCase();
                                }
                                return ($f == $s) ? 0 : (($f > $s) ? sort : -1 * sort);
                            });
                        }
                        _this.prepareData(_this.copyData);
                    });
                }
                _tr.appendChild(_th);
            });
            _thead.appendChild(_tr);            
            return _thead;
        }
        JsGrid.prototype.prepareData = function (data) {
            var _this = this;
            var _tbody = _this.gridElement.querySelector('tbody');
            if(!_tbody){
                _tbody = this.createElement('tbody');
            }
            else {
                _tbody.innerHTML = '';
            }
            var _row = '', _cell, totalData = [];
            if (_this.config.pagination) {
                _this.config.pageSetting.totalPages = (function () {
                    if (data.length) {
                        return Math.ceil(data.length / _this.config.pageSetting.pageSize);
                    }
                    return 1;
                })();
                if (_this.config.pageSetting.totalPages < _this.config.pageSetting.currentPage) {
                    _this.config.pageSetting.currentPage = _this.config.pageSetting.totalPages;
                }
                var _input = _this.gridElement.querySelector('[class=paginationInput]');
                if (_input) {
                    _input.value = _this.config.pageSetting.currentPage;
                }
                var totalCount = _this.gridElement.querySelector('[class=pageTotalCount]');
                if (totalCount) {
                    totalCount.textContent = _this.config.pageSetting.totalPages;
                }
                var startIndex = ( _this.config.pageSetting.currentPage - 1) * _this.config.pageSetting.pageSize;
                totalData = data.slice(startIndex, startIndex + _this.config.pageSetting.pageSize);
            }
            else{
                totalData = data;
            }
            counter = startIndex;
            totalData.forEach(function (data, i) {
                _row = _this.createElement('tr');
                _row.setAttribute('data-index',counter++)
                if (_this.config.multiselect) {
                    cell = _this.createElement('td');
                    var checkBox = _this.createElement('input');
                    checkBox.type = "checkbox";
                    checkBox.className = 'jsGrid--checkbox';
                    checkBox.addEventListener('change', function () {
                        var className = 'jsGrid--checkbox'
                        if(this.checked){
                            className += ' checked';
                        }
                        this.className = className;
                    });
                    cell.appendChild(checkBox);
                    _row.appendChild(cell);
                }
                _this.config.columns.forEach(function (column, i) {
                    cell = _this.createCell(column, data[column.fieldname]);
                    if(_this.config.editable && !column.disabled){
                        cell.addEventListener('click', function () {
                            var input = '', element = '';
                            if (event.target.noClick) {
                                return false;
                            }
                            if (column.type == 'dropdown') {
                                input = _this.createElement('select');
                                input.noClick = true;
                            }
                            else {
                                input = _this.createElement('input');
                            }
                            var ele = this;
                            var value = this.textContent || this.innerHTML;
                            if (/^<.*>[.*<\/.*>]*$/.test(value)) {

                            }
                            else {
                                var width = ele.offsetWidth;
                                ele.textContent = '';
                                ele.style.width = width + 'px';
                                ele.className = 'jsGrid-table-cell edit-cell';
                                if(column.type == 'currency'){
                                    input.type = 'number';
                                    var addSlash = column["currency"].replace(/\w+/, '').length > 0 ? '\\' : '';
                                    var repReg = new RegExp(addSlash + column["currency"]);
                                    value = value.replace(repReg, '');
                                    input.value = parseInt(value);

                                    input.addEventListener('keydown', function () {
                                        if (event.keyCode == 13) {
                                            this.blur();
                                        }
                                    });
                                    element = input;
                                }
                                if(column.type == 'date'){
                                    var intGroup = _this.createElement('div');
                                    intGroup.className = 'input-group jsGrid-inputGroup';
                                    input.className = "form-control fa fa-calendar";
                                    //input.addEventListener("focus", function () {
                                    //    _this.prepareDatePicker(this,column);
                                    //});                                    
                                    input.value = value;
                                    intGroup.appendChild(input);
                                    var icon = _this.createElement('span');
                                    icon.className = "input-group-addon fa fa-calendar";
                                    icon.addEventListener("click", function () {
                                        input.focus();
                                        var _datePicker = prepareDatePicker();
                                        _datePicker.left = this.offsetParent.offsetLeft + 'px';
                                        _datePicker.top = this.offsetParent.offsetTop + 'px';
                                        _datePicker.position = "absolute";
                                        console.log(_datePicker);
                                        //element.appendChild(_datePicker);
                                    });
                                    intGroup.appendChild(icon);
                                    element = intGroup;
                                    input.addEventListener('keydown', function () {
                                        if (event.keyCode == 13) {
                                            this.blur();
                                        }
                                    });
                                }
                                else if(column.type == 'dropdown'){
                                    var drdnData = _this.config.dropdowns.find(function (obj) { return obj['fieldname'] == column['fieldname'] }) || {};
                                    var options = '';
                                    (drdnData['values'] || []).forEach(function (obj, i) {
                                        options = _this.createElement('option');
                                        options.value = obj['value'];
                                        options.text = obj['name'];
                                        input.appendChild(options);
                                    });
                                    input.value = this.originalValue;
                                    element = input;
                                }
                                else {                                    
                                    input.value = value;
                                    input.addEventListener('keydown', function () {
                                        if (event.keyCode == 13) {
                                            this.blur();
                                        }
                                    });
                                    element = input;
                                }                                
                                //input.addEventListener('blur', function () {
                                //    value = this.value;
                                //    ele.innerHTML = '';
                                //    ele.style.width = '';
                                //    if(column['type'] == 'currency'){
                                //        if (column['currency']) {
                                //            if (column['position'] == 'left') {
                                //                value = column['currency'] + value;
                                //            }
                                //            else {
                                //                value += column['currency'];
                                //            }
                                //        }
                                //    }
                                //    else if (column['type'] == 'dropdown') {
                                //        var record = (_this.config.dropdowns || []).find(function (obj) { return obj['fieldname'] == column['fieldname'] }) || {};
                                //        if (record.hasOwnProperty('values')) {
                                //            var matchRecord = (record['values'] || []).find(function (obj) { return obj['value'] == value; }) || {};
                                //            if (matchRecord) {
                                //                ele.originalValue = value;
                                //                value = matchRecord['name'] || value;
                                //            }
                                //        }
                                //    }
                                //    ele.textContent = value;
                                //    ele.className = 'jsGrid-table-cell';
                                //});
                                this.appendChild(element);
                                input.focus();
                            }                            
                        });
                    }
                    _row.appendChild(cell);
                });
                _tbody.appendChild(_row);
            });
            return _tbody;
        }
        JsGrid.prototype.prepareToolbar = function () {
            var _this = this;
            var toolbar = _this.createElement('div');
            var filterInput = _this.createElement('input');
            filterInput.className = 'filter';
            filterInput.oldValue = '';
            filterInput.addEventListener('keyup', function () {
                var value = this.value;
                if(!value){
                    _this.copyData = _this.config.data;
                }
                else {
                    if (filterInput.oldValue.length > value.length) {
                        _this.copyData = _this.config.data;
                    }
                    var _dobj = "", i;
                    filterInput.oldValue = value;
                    var tempData = _this.copyData.filter(function (obj) {
                        _dobj = '';
                        for (i in obj) {
                            _dobj += obj[i] + ','
                        }
                        value = new RegExp(value, ['i']);
                        return value.test(_dobj);
                    });
                    _this.copyData = tempData;
                }
                _this.prepareData(_this.copyData);
            });
            toolbar.appendChild(filterInput);
            toolbar.className = 'JsGrid--toolbar'
            return toolbar;
        }
        JsGrid.prototype.preparePaging = function () {
            var _this = this;
            var paging = _this.createElement('div');
            paging.className = 'JsGrid-pagination';
            var left = _this.createElement('div');
            left.className = 'pagination pagingActions';
            var btn = _this.createElement('button');
            btn.className = 'btn btn-default btn-sm pagingBtn fa fa-angle-double-left';
            btn.addEventListener('click', function () {
                _this.changePage(1);
            });
            left.appendChild(btn);
            
            btn = _this.createElement('button');
            btn.className = 'btn btn-default btn-sm pagingBtn fa fa-angle-left';
            btn.addEventListener('click', function () {
                _this.changePage(_this.config.pageSetting.currentPage - 1);
            });
            left.appendChild(btn);

            var input = _this.createElement('input');
            input.className = 'paginationInput';
            input.value = _this.config.pageSetting.currentPage;
            input.addEventListener('change', function () {
                //if(this.value == ''){
                //    return false;
                //}
                var page = parseInt(this.value);
                if(page == NaN){
                    page = 1;
                }
                _this.changePage(page);
            });
            left.appendChild(input);

            var span = _this.createElement('span');
            span.className = 'pageTotalCount';
            span.textContent = _this.config.pageSetting.totalPages;
            left.appendChild(span);

            btn = _this.createElement('button');
            btn.className = 'btn btn-default btn-sm pagingBtn fa fa-angle-right';
            btn.addEventListener('click', function () {
                _this.changePage(_this.config.pageSetting.currentPage + 1);
            });
            left.appendChild(btn);

            btn = _this.createElement('button');
            btn.className = 'btn btn-default btn-sm pagingBtn fa fa-angle-double-right';
            btn.addEventListener('click', function () {
                _this.changePage(_this.config.pageSetting.totalPages);
            });
            left.appendChild(btn);
            var pages = _this.config.pageSetting.pages;
            if(pages.length){
                if (pages.indexOf(_this.config.pageSetting.pageSize) == -1) {
                    pages.push(_this.config.pageSetting.pageSize);
                }
                pages.sort(function (a, b) { return (a == b) ? 0 : (a < b ? -1 : 1) });
                var select = _this.createElement('select');
                select.className = 'jsGrid--paging-select'
                var option = '';
                pages.forEach(function (count) {
                    option = _this.createElement('option');
                    option.value = option.text = count;
                    select.appendChild(option);
                });
                select.value = _this.config.pageSetting.pageSize;
                select.addEventListener('change', function () {
                    _this.config.pageSetting.pageSize = parseInt(this.value, 10);
                    _this.prepareData(_this.copyData);
                });
                left.appendChild(select);
            }
            paging.appendChild(left);
            return paging;
        }
        JsGrid.prototype.changePage = function (page) {
            var _this = this;
            if (page <= 0 || !page) {
                page = 1;
            }
            else if (page > _this.config.pageSetting.totalPages) {
                page = _this.config.pageSetting.totalPages;
            }
            if (_this.config.pageSetting.currentPage != page) {
                _this.config.pageSetting.currentPage = page;
                _this.prepareData(_this.copyData);
                _this.gridElement.querySelector('[class=paginationInput]').value = page;
            }
        }


        //DatePicker
        JsGrid.prototype.prepareDatePicker = function (element,properties) {
            var _this = this;
            var div = _this.createElement('div');
            var divStyles = div.style;
            divStyles.width = '120px';
            divStyles.height = '150px';
            divStyles.top = element.offsetTop + element.offsetHeight + 'px';
            divStyles.left = element.offsetLeft ? 0 : element.offsetLeft + 'px';
            divStyles.backgroundColor = '#dedede';
            divStyles.position = "absolute";
            element.parentElement.className += ' datePickerCell';
            element.parentElement.appendChild(div);
            //debugger;
        };

        //Get Selected rows
        JsGrid.getSelectedRows = function () {
            var _this = gridRef, rows = [];
            if (_this.isAllSelected) {
                rows = _this.copyData;
            }
            else {
                var checkBoxs = _this.gridElement.querySelectorAll('[class="jsGrid--checkbox checked"]');
                var parent = '',index;
                for (var i = 0; i < checkBoxs.length; i++){
                    parent = checkBoxs[i].parentElement.parentElement;
                    index = parent.getAttribute('data-index');
                    rows.push(_this.copyData[index]);
                }
            }
            return rows;
        }

        function GridPrepare(config) {
            var grid = new JsGrid(config);
            return grid;
        }
        return GridPrepare;
    })();
    Grid.PrepareGrid = PrepareGrid;
})(window.Grid || (window.Grid = {}));