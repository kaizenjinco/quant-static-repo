define(['plugins/http', 'plugins/router', 'knockout', './../authenticate/manage', 'toastr'], function (http, router, ko, authenticate, toastr) {
    var vm = function () {
        var self = this;
        this.DataTable = ko.observableArray([]);
        this.message = ko.observable("");
        this.username = ko.observable("");
        this.password = ko.observable("");
        this.captcha = ko.observable("");
        this.codeCaptcha = ko.observable("");
        this.loginFailed = ko.observable(false);
        this.enableLogin = ko.observable(true);
        this.imgData = ko.observable();
        this.loginInput = function(d, e) {
            if (e.keyCode === 13) {
                self.login();
            }
            return true;
        }
        this.login = function () {
            self.enableLogin(false);
            if (self.username() === undefined || self.username() === '' || self.username() === null) {
                toastr["error"]("Vui lòng nhập tên đăng nhập!");
                self.enableLogin(true);
            }
            else if (self.password() === undefined || self.password() === '' || self.password() === null) {
                toastr["error"]("Vui lòng nhập mật khẩu!");
                self.enableLogin(true);
            }
            else if (self.captcha() === undefined || self.captcha() === '' || self.captcha() === null) {
                toastr["error"]("Vui lòng nhập mã xác thực!");
                self.enableLogin(true);
            }
            else if (self.captcha() !== self.codeCaptcha()) {
                toastr["error"]("Mã xác thực chưa đúng!");
                self.message("Mã xác thực chưa đúng!");
				self.GetImgData();
                self.enableLogin(true);
            }
            else {
                http.post("/Account/Login", {
                    username: self.username(),
                    password: self.password(),
                    //captcha: self.captcha()
                }).then(function (data) {
                    self.enableLogin(true);
                    self.loginFailed(data.status);
                    if (data.status) {
                        authenticate.isAuthenticated();
                        //router.navigate("#inbox");
                        router.navigate(authenticate.urlDefault());
                        location.reload();
                    } else {
                        self.password('');
                        self.GetImgData();
                        self.message(data.info);
                    }
                });
            }
        }
        

        this.makeTreeTable = function () {
            http.post_sync("/Application/GetKpi", { fromDate: "2016/08/01", toDate: "2016/09/01" }).then(function (data) {
                self.DataTable(data);
            });

            var element = $("#applicationHost");
            webix.ready(function () {
                var grida = webix.ui({
                    id: "tableId",
                    container: "tableId",
                    view: "treetable",
                    scroll: true,
                    //leftSplit: 5,
                    data: self.DataTable(),
                    columns: [
                        { id: "Check_Move", header: "<input class='baddebt_move_to_planning btn btn-primary btn-xs btn-outline' type='button' value='Xuất dữ liệu'>", width: 105},
                        { id: "EmployeesCode", header: ["Mã nhân viên", { content: "textFilter" }],  width: 250, sort: "string" },
                        { id: "AccNo", header: ["AccNo", { content: "textFilter" }], width: 150, sort: "string" },
                        { id: "OpenDate", header: ["OpenDate", { content: "textFilter" }], width: 150, sort: "string" },
                        { id: "ProductName", header: ["ProductName", { content: "textFilter" }], width: 150, sort: "string" }
                    ],
                    filterMode: {
                        level: 2
                    },
                    scheme: {
                        $change: function (item) {
                        },
                        $serialize: function (obj) {
                            return obj;
                        }
                    },
                    editable: true,
                    width: "95%",
                    height: element.height() - 100
                });

                grida.on_click.baddebt_move_to_planning = function (e, id, trg) {
                    grida.refresh();
                    webix.toExcel($$("tableId"), {
                    });
                    return false;
                };

                // var items = grida.data.serialize();
            });
        }

        this.attached = function (view) {
            self.view = view;
            self.GetImgData();
        }
        this.GetImgData = function () {
            self.captcha('')
            //http.post_sync("/Account/GetCaptchaByte").then(function (data) {
            //    self.imgData(data);
            //});
            document.getElementById('captcha').innerHTML = "";
            var charsArray = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
            var lengthOtp = 6;
            var captcha = [];
            for (var i = 0; i < lengthOtp; i++) {
                var index = Math.floor(Math.random() * charsArray.length + 1);
                if (captcha.indexOf(charsArray[index]) == -1)
                    captcha.push(charsArray[index]);
                else i--;
            }
            var canv = document.createElement("canvas");
            canv.id = "captcha";
            canv.width = 100;
            canv.height = 50;
            var ctx = canv.getContext("2d");
            //set font
            ctx.font = "25px Georgia bold";

            //set Color
            var gradient = ctx.createLinearGradient(0, 0, canv.width, 0);
            gradient.addColorStop("0", "magenta");
            gradient.addColorStop("0.5", "blue");
            gradient.addColorStop("1.0", "red");
            ctx.strokeStyle = gradient;

            //set text
            ctx.strokeText(captcha.join(""), 0, 30);

            self.codeCaptcha(captcha.join(""));
            document.getElementById("captcha").appendChild(canv);
        }
        this.refreshCaptcha = function () {
            self.GetImgData();
            self.captcha('');
        }
      
    }
    return vm;
})