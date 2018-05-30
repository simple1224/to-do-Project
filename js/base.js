;(function () {
    'use strict';

    var $window = $(window)
        ,$body = $('body')
        ,$form_add_task = $('.add-task')//页面添加按钮的那一行的总input
        ,task_list = []//store的一个最大容器  存放new_task
        ,$task_delete_trigger
        ,$task_detail
        ,$task_detail_trigger
        ,$task_detail = $('.task-detail')
        ,$task_detail_mask = $('.task-detail-mask')
        ,current_index
        ,$update_form
        ,$task_detail_content
        ,$task_detail_content_input
        ,$checkbox_complete
        ,$msg = $('.msg')
        ,$msg_content = $msg.find('.msg_content')
        ,$msg_confirm = $msg.find('.confirmed')
        ,$alerter = $('.alerter')
        ;

    /*
    store.set("user",'韩梅梅');
    var user = store.get('user');
    console.log('user',user);*/

    init();
    //程序开始时触发init()方法
    function init() {
        //获取当前store的值
        task_list= store.get('task_list') || [];
        Listen_msg_event();
        //如果一开始有task存在 则渲染一次  显示task
        if(task_list.length)
            render_task_list();
        // console.log('store.get(task_list)',store.get('task_list'))
        task_remind_check();
    }

    $form_add_task.on('submit',on_add_task_form_submit);
    $task_detail_mask.on('click',hide_task_detail);

    //e表示event时间 按submit进行事件监听
    function on_add_task_form_submit(e) {
        //每次都会产生一个new_task
        var new_task = {},$input;
        //禁用默认行为  不使用默认提交方式
        e.preventDefault();
        //取新task的值 获取name为comtent的内容
        //jq中的.find()方法可以找到这个元素的所有后代元素 但不包括自己。
        // 和.children()方法相似 后者是遍历向下遍历一个层级
        $input = $(this).find('input[name=content]');
        new_task.content = $input.val();
        //如果新task的值为空则直接返回 否则继续执行
        if(!new_task.content) return;
        //存入新task  如果添加成功，则开始渲染
        if(add_task(new_task)){
            // render_task_list();
            //每次用完把内容清空
            $input.val(null);
        }
    }

    //新增一条task
    function add_task(new_task) {
        //将新的task推入task_list，即改变task_list的值
        task_list.push(new_task);
        //把task_list的值放入store 这个更新的功能封装到refresh里了
        //store.set('task_list',task_list)
        //更新localStorage
        refresh_task_list();
        return true;
    }

    //渲染单条task模版
    function render_task_item(data,index) {
        if(!data || !index) return;
        var list_item_tpl =
            //data-*是H5新增的一项新功能  自定义数据属性  在js中用dataset 属性来存取 data-* 自定义属性的值
            //获取值时应该符合驼峰命名法  var a=document.getElementsByTagName(input); a.dataset.indexColor;
            '<div class="task-item" data-index="' + index + '">'+
            '<span><input class="complete" '+ (data.complete ? 'checked':'')+' type="checkbox"></span>'+
            '<span class="task-content">' + data.content + '</span>'+
            '<span class="fr">'+
            '<span class="action delete"> 删除</span>'+
            '<span class="action detail"> 详细</span>'+
            '</span>'+
            '</div>';
        return $(list_item_tpl);//把这个list_item_tpl返回给render_task_list进行渲染
    }

    //渲染全部的task模版
    function render_task_list() {
        var $task_list = $('.task-list');//获取页面的所有task的总div
        $task_list.html('');
        var complete_items = [];
        var $task = render_task_item();//$task是渲染单条task返回的值
        //全部的数据都在task_list中
        for(var i = 0;i<task_list.length;i++){
            var item = task_list[i];
            if( item && item.complete)
                complete_items[i] = item;
            else
                var $task = render_task_item(item,i);
            $task_list.prepend($task);// 把单调数据添加到任务列表中
        }
        // console.log('complete_item',complete_items)

        //开始迭代   了解什么叫迭代
        for(var j = 0;j < complete_items.length;j++){
            $task = render_task_item(complete_items[j],j);
            if(!$task) continue;
            $task.addClass('completed');
            $task_list.append($task);
        }

        $task_delete_trigger = $('.action.delete');
        $task_detail_trigger = $('.action.detail');
        $checkbox_complete = $('.task-list .complete[type=checkbox]');
        Listen_task_delete();
        Listen_task_detail();
        Listen_checkbox_complete();
    }
    //以上内容是添加task
    //#################################################################################
    //下面开始删除task
    //删除一条task
    function task_delete(index) {
        //如果没有index 或者  index不存在则直接返回
        if(index === undefined || !task_list[index]) return;
        delete task_list[index];
        //更新localStorage
        refresh_task_list();
    }

    //刷新localStorage数据，并渲染模版tpl
    function refresh_task_list() {
        //更新数据
        store.set('task_list',task_list);
        //再渲染一次
        render_task_list();
    }

    function pop(arg) {
        if(!arg){
            console.error('pop title is required');
        }

        var conf = {},
            $box,
            $mask,
            $title,
            $content,
            $confirm,
            $cancel,
            timer,
            dfd,
            confirmed;

        dfd = $.Deferred();//Defered()方法用于返回一个dfd对象
        //$dfd.resolve();//运行耗时的异步操作  不知何时返回对象
        if ( typeof arg == 'string')
            conf.title = arg;
        else{
            conf = $.extend(conf,arg);
        }

        $box = $('<div>'+
            '<div class="pop-title">'+ conf.title +'</div>'+
            '<div class="pop-content">'+
            '<div>'+
            '<button style="margin-right:5px" class="primary confirm">确定</button>'+
            '<button class="cancel">取消</button>'+
            '</div>'+
            '</div>'+
            '</div>').css({
            width: 300,
            height: 'auto',
            padding:'15px 10px',
            background:'#fff',
            position: 'fixed',
            'border-radius':3,
            'box-shadow':'0 1px 2px rgba(0,0,0,.3)'
            //第一个参数是横向偏移，第二个像素是纵向偏移，第三个参数是阴影扩散半径 ，第四个参数使阴影面积变大
        });

        $title = $box.find('.pop-title').css({
            padding: '5px 10px',//上下为5
            'font-weight': 900,
            'font-size': 20,
            'text-align': 'center',
        });
        $content = $box.find('.pop-content').css({
            padding: '5px 10px',
            'text-align': 'center'
        });

        $confirm = $content.find('button.confirm');
        $cancel = $content.find('button.cancel');

        $mask = $('<div></div>').css({
            position: 'fixed',
            background : 'rgba(0,0,0,.4)',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0
        });

        timer = setInterval(function () {
            if(confirmed !== undefined){
                dfd.resolve(confirmed);
                clearInterval(timer);
                dismiss_pop();
            }
        },50);

        $confirm.on('click',on_confirm);
        $cancel.on('click',on_cancel);
        $mask.on('click',on_cancel);

        function on_confirm() {
            confirmed = true ;
        }
        function on_cancel() {
            confirmed = false ;
        }

        function dismiss_pop() {
            $mask.remove();
            $box.remove();
        }

        function adjust_box_position() {
            // console.log('$window.width()',$window.width())
            var window_width = $window.width()
                , window_height = $window.height()
                , box_width = $box.width()
                , box_height = $box.height()
                // console.log('window_width,window_height,box_width,box_height',window_width,window_height,box_width,box_height)
                ,move_x
                ,move_y
                ;

            move_x = (window_width - box_width) / 2;
            move_y = ((window_height - box_height) / 2) - 20;

            $box.css({
                left: move_x,
                top: move_y,
            })
        }

        $window.on('resize',function () {
            adjust_box_position();
        });

        $mask.appendTo($body);
        $box.appendTo($body);
        $window.resize();
        return dfd.promise();//返回promise
    }



    function Listen_msg_event() {
        $msg_confirm.on('click',function () {
            hide_msg()
        })
    }


    //监听打开task详情事件
    function Listen_task_detail() {
        var index;
        $('.task-item').on('dblclick',function () {
            index = $(this).data('index');
            show_task_detail(index);
        });

        $task_detail_trigger.on('click',function () {
            var $this = $(this);
            var $item = $this.parent().parent();
            index = $item.data('index');
            show_task_detail(index);
        })
    }

    //监听完成任务（task）事件
    function Listen_checkbox_complete() {
        $checkbox_complete.on('click',function () {
        var $this = $(this);
        var index = $this.parent().parent().data('index');
        var item = get(index);
        if(item.complete)
            update_task(index,{complete:false});
        else
            update_task(index,{complete:true});
        })
    }
    function get(index) {
        return store.get('task_list')[index];
    }
    
    //查看task详情
    function show_task_detail(index) {
        //生成详情模版
        render_task_detail(index);
        current_index = index;
        //显示详情模版(默认隐藏)
        $task_detail.show();
        //显示详情模版task(默认隐藏)
        $task_detail_mask.show();

    }
    //更新task
    function update_task(index,data) {
        if(!index || !task_list[index])
            return;

        // task_list[index] = data;
        task_list[index] = $.extend({},task_list[index],data);
        //Angular中的merge（）方法相当于jQuery中的extend()
        refresh_task_list();
    }

    //隐藏task详情
    function hide_task_detail() {
        $task_detail.hide();
        $task_detail_mask.hide();
    }

    //渲染指定task的详细信息  render:专业术语渲染
    function render_task_detail(index) {
        if(index === undefined || !task_list[index]) return;

        var item = task_list[index];

        var tpl =
        '<form>'+
        '<div class="content">'+
            item.content+
        '</div>'+
            '<div class="input_item"><input style="display : none;" type="text" name="content" value="'+(item.content || '')+'"></div>'+
        '<div>'+
            '<div class="desc input_item">'+
                '<textarea  name="desc">'+ (item.desc || '') + '</textarea>'+
            '</div>'+
        '</div>'+
            '<div class="remind input_item">'+
                '<label for="">提醒时间</label>'+
                '<input class="datetime" name="remind_date" type="text" value="'+ (item.remind_date || '') +'">'+
            '</div>'+
            '<div class="input_item"><button type="submit">更新</button></div>'+
        '</form>';
        //清空task详情
        $task_detail.html(null);
        //用新模版替换旧模版
        $task_detail.html(tpl);
        $('.datetime').datetimepicker();
        //选中其中的form元素，因为之后会使用其监听submit事件
        $update_form = $task_detail.find('form');
        //选中显示task内容的元素
        $task_detail_content = $update_form.find('.content');
        //选中显示task input内容的元素
        $task_detail_content_input = $update_form.find('[name=content]');

        //双击内容元素显示input，隐藏自己
        $task_detail_content.on('dblclick',function () {
            $task_detail_content_input.show();
            $task_detail_content.hide();
        });

        $update_form.on('submit',function (e) {
            e.preventDefault();
            var data = {};
            //获取表单中各个input的值
            data.content = $(this).find('[name=comment]').val();
            data.desc = $(this).find('[name=desc]').val();
            data.remind_date = $(this).find('[name=remind_date]').val();
            // console.log('data',data)
            update_task(index,data);
            hide_task_detail();
        })

    }

    //查找并监听所以删除按钮的点击事件
    function Listen_task_delete() {
        $task_delete_trigger.on('click',function () {
            var $this = $(this);
            //找到删除按钮所在的task元素
            var $item = $this.parent().parent();
            var index = $item.data('index');
            //确认删除
            pop("确定删除吗")
                .then(function () {
                    r ? task_delete(index) : null;
                })

        });
    }










    function task_remind_check() {
        // show_msg();
        var current_timestamp;
        var itl = setInterval(function () {
            for (var i = 0; i < task_list.length; i++){
                var item = get(i),task_timestamp;
                if(!item || item.remind_date || item.informed) continue;

                current_timestamp = (new Date()).getTime();
                // console.log('current_timestamp',current_timestamp)
                //getTime()把当前时间转化为时间戳
                task_timestamp = (new Date(item.remind_date)).getTime();
                if(current_timestamp - task_timestamp >= 1){
                    update_task(i,{informed:true});
                    show_msg(item.content);
                }
            }
        },300);
    }

    function show_msg(msg) {
        if(!$msg)  return;
        $msg_content.html(msg);
        $alerter.get(0).play();
        $msg.show();
    }
    function hide_msg() {
        $msg.hide();
        }



})();