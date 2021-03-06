var app = new Vue({
    el: "#app",
    data: {
        updateMin: 5,
        timeCol: 0,
        timeAdjust: 0,
        timeSeparator: ':',
        timetableHeader: [],
        timetableBody: [],
        tmpTimetable: '',
        currentTime: '',
    },
    mounted: function () {
        var getValueSettleOrDefault = function (key, defaultValue) {
            var val = localStorage.getItem(key);
            return val === '' ? defaultValue : val;
        };
        this.tmpTimetable = localStorage.getItem('vue-timeline.table');
        this.timeCol = getValueSettleOrDefault('vue-timeline.timecol', 0);
        this.timeAdjust = getValueSettleOrDefault('vue-timeline.timeadjust', 0);
        this.timeSeparator = getValueSettleOrDefault('vue-timeline.timeseparator', ':');
    },
    watch: {
        /**
         * タイムテーブルの生成等
         */
        tmpTimetable: function () {
            // save
            localStorage.setItem('vue-timeline.table', this.tmpTimetable);
            // 整形
            this.timetableHeader = [];
            this.timetableBody = [];
            var rows = this.tmpTimetable.split(/[\r\n]+/g);
            if (rows.legnth <= 1) {
                return;
            }
            var bodyRow, cols, row;
            for (var i = 0; i < rows.length; i++) {
                row = rows[i];
                cols = row.split(/\t/g);
                if (i === 0) {
                    this.timetableHeader = cols;
                } else {
                    times = this._getTimes(cols);
                    bodyRow = {
                        fr: times.fr,
                        to: times.to,
                        cols: cols,
                        isCurrent: false,
                        isDone: false,
                    };
                    if (times.fr === undefined && times.to === undefined) {
                        console.log('row' + i + ': 開始・終了時間未設定');
                    }
                    this.timetableBody.push(bodyRow);
                }
            }
            this._checkTimes();
        },
        /**
         * 現在実施中のデータを取得
         * @param {string} after
         */
        currentTime: function () {
            this._checkTimes();
        },
        /**
         * 時間列
         */
        timeCol: function () {
            localStorage.setItem('vue-timeline.timecol', this.timeCol);
        },
        /**
         * 時間のセパレータ
         */
        timeSeparator: function () {
            localStorage.setItem('vue-timeline.timeseparator', this.timeSeparator);
        },
        /**
         * おしてる時間
         */
        timeAdjust: function () {
            setCurrentTime();
            localStorage.setItem('vue-timeline.timeadjust', this.timeAdjust);
        },
    },
    methods: {
        /**
         * 時間の更新
         */
        refresh: function () {
            setCurrentTime();
        },
        /**
         * 開始・終了時間を取得
         * @param {string[]} row
         * @return {string[]}
         */ 
        _getTimes: function (row) {
            var timeCol = row[this.timeCol];
            var regex = RegExp('[0-9]{2}'+this.timeSeparator+'[0-9]{2}', 'g');
            var times = [];
            while ((regRet = regex.exec(timeCol)) !== null) {
                if (regRet !== null) {
                    times.push(regRet[0]);
                }
            }

            var ret = {
                fr: times[0],
                to: times[times.length - 1],
            };
            // if (ret.fr === undefined && ret.to === undefined) {
            //     throw new Error('時間設定が不正');
            // }

            return ret;
        },
        /**
         * 時間超過してるか？をチェックアンド設定
         * @param {object} row
         */
        _checkIsDone: function (row) {
            if (row.to === undefined) {
                if (row.fr === undefined) {
                    row.isDone = false;
                } else {
                    row.isDone = true;
                }
            } else {
                row.isDone = row.to < this.currentTime;
            }
        },
        /**
         * 現在実施中のものをチェック
         */
        _checkTimes: function () {
            var row;
            var setCurrent = false;
            for (var i = 0; i < this.timetableBody.length; i++) {
                row = this.timetableBody[i];
                // 超過したかどうかをチェック
                this._checkIsDone(row);
                // 現在のものだけフラグ立てる
                row.isCurrent = false;
                if (!row.isDone && !setCurrent) {
                    row.isCurrent = true;
                    setCurrent = true;
                }
            }
        }
    }
});

// 現時刻の設定
var currentDate, currentTime;
var setCurrentTime = function () {
    currentDate = new Date();
    // 調整
    if (app.timeAdjust) {
        currentDate.setMinutes(currentDate.getMinutes() - parseInt(app.timeAdjust));
    }
    var h = ('00' + currentDate.getHours()).slice(-2);
    var m = ('00' + currentDate.getMinutes()).slice(-2);
    Vue.set(app, 'currentTime', h + app.timeSeparator + m);
};
setCurrentTime();
// 5分ごとに更新
setInterval(setCurrentTime, 5 * 60 * 1000);