/**
 * title:todojk
 * author:yjk
 * create at 2015-10-23 19:31:07
 */

$(function() {
    //Model
    var Todo = Backbone.Model.extend({
        defaults: {
            name: '',
            done: false
        },
        toggle: function() {
            this.save({
                done: !this.get("done")
            });
        }
    });


    //Collection
    var Collection = Backbone.Collection.extend({
        model: Todo,
        localStorage: new Backbone.LocalStorage('TODOJK221'),
        done: function() {
            return this.where({
                done: true
            });
        },
        remaining: function() {
            return this.where({
                done: false
            });
        }
    });


    var Model = new Todo;
    var Todos = new Collection;

    //TodoView
    var TodoView = Backbone.View.extend({
        tagName: 'li',
        template: _.template('<div class="view"><input class="toggle" type="checkbox" <%= done ? (checked="checked") : "" %> /> <label><%- title %></label><a class="destroy"></a></div> <input class="edit" type="text" value="<%- title %>" />'),
        initialize: function() {
            //model改变，绘制
            this.listenTo(this.model, 'change', this.render);
            //模型销毁，溢出
            this.listenTo(this.model, 'destroy', this.remove)
        },
        events: {
            "dblclick .view": "edit",
            "click .toggle": "toggleDone",
            "click a.destroy": "clear",
            "blur .edit": "close",
            "keypress .edit": "updateOnEnter"
        },
        render: function() {
            this.input = this.$('.edit');
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.toggleClass('done', this.model.get('done'));
            return this;
        },
        clear: function() {
            this.model.destroy();
        },
        toggleDone: function() {
            this.model.toggle();
        },
        edit: function() {
            this.$el.addClass('editing');
            this.$('.edit').focus();
        },
        close: function() {
            var value = this.$('.edit').val();
            if (!value) {
                this.clear();
            } else {
                this.model.save({
                    title: value
                });
                this.$el.removeClass('editing');
            }
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) this.close();
        }

    });

    //StatusView
    var StatusView = Backbone.View.extend({
        template: _.template('<% if (done) { %><a id="clear-completed">Clear <%= done %> completed <%= done == 1 ? "item" : "items" %></a><% } %>   <div class="todo-count"><b><%= remaining %></b> <%= remaining == 1 ? "item" : "items"%> left</div>'),
        initialize: function() {
            this.listenTo(Todos, 'all', this.render);
        },
        render: function() {
            var footer = $('#footer');
            var done = Todos.done().length;
            var remaining = Todos.remaining().length;
            footer.html(this.template({
                done: done,
                remaining: remaining
            }))
            if (Todos.length) {
                footer.show();
            } else {
                footer.hide();
            }
        }
    })


    //InputView
    var InputView = Backbone.View.extend({
        el: '#inputArea',
        template: "<input id='new-todo' type='text' placeholder='What needs to be done?'>",
        initialize: function() {

            this.$el.html(this.template);
            //必须执行完第一步才能找到上下文，否则定位到document
            this.input = this.$('#new-todo');


            // $(document).bind('keypress',this.addNewTodo);

        },
        events: {
            'keypress #new-todo': 'addNewTodo'
        },
        addNewTodo: function(e) {
            if (e.keyCode != 13) return;
            if (!this.input.val()) return;
            Todos.create({
                title: this.input.val()
            })
            this.input.val('');
        }
    });


    //CheckAll
    var CheckAll = Backbone.View.extend({
        el: $('#checkall'),
        template: '<input id="toggle-all" type="checkbox"><label for="toggle-all">Mark all as complete</label>',
        initialize: function() {
            this.$el.html(this.template);
            this.checkAll = this.$('input[id=toggle-all]');
            this.on('IfAllcheck', this.alertLog, this);
        },
        alertLog: function() {            
            this.checkAll.checked = !(Todos.remaining().length);
            this.trigger('changeChecked', this.checkAll.checked)
        },
        events: {
            "click #toggle-all": "togglStatus"
        },
        togglStatus: function() {
            this.checkAll.checked = !this.checkAll.checked;
            this.trigger('checkAll', this.checkAll.checked);
        }
    });


    //AppView
    var AppView = Backbone.View.extend({
        el: $('#todoapp'),
        initialize: function() {
            var stats = new StatusView;
            this.check = new CheckAll;
            this.allCheck = this.$('#toggle-all')[0];
            this.listenTo(this.check, 'checkAll', this.allCompleted);
            this.listenTo(this.check,'changeChecked',function(value){
                this.allCheck.checked=value;
            });
            this.main = this.$('#main');
            this.footer = this.$('#footer');
            this.input = this.$('#new-todo');
            Todos.on('all', this.todoChange, this);
            this.listenTo(Todos, 'add', this.addOne);
            this.listenTo(Todos, 'reset', this.addAll);
            this.listenTo(Todos, 'all', this.render);
            var inputView = new InputView();
            Todos.fetch();
        },
        render: function() {
            var done = Todos.done().length;
            var remaining = Todos.remaining().length;
            if (Todos.length) {
                this.main.show();
            } else {
                this.main.hide();
            }
        },
        todoChange: function() {
            this.check.trigger('IfAllcheck', Todos.remaining().length);
        },
        events: {
            "click #clear-completed": "clearCompleted"
        },
        addOne: function(todo) {
            var view = new TodoView({
                model: todo
            });
            this.$('#todo-list').append(view.render().el);
        },
        addAll: function() {
            Todos.each(this.addOne, this);
        },
        allCompleted: function() {
            var stats = this.allCheck.checked;
            Todos.each(function(todo) {
                todo.save({
                    'done': stats
                });
            })
        },
        clearCompleted: function() {
            _.invoke(Todos.done(), 'destroy');
            return false;
        }
    })
    var App = new AppView;
})
