/**
 * @name MMios签到
 * @author Gemini
 * [rewrite_local]
 * ^https:\/\/www\.mmios\.net\/wp-admin\/admin-ajax\.php url script-request-header mmios_checkin.js
 * [task_local]
 * 30 8 * * * mmios_checkin.js, tag=MMios签到, enabled=true
 */

const $ = new Env("MMios签到");
const cookieKey = "mmios_cookie";
const bodyKey = "mmios_body";

// 获取环境中的保存的信息
let cookieVal = $prefs.valueForKey(cookieKey);
let bodyVal = $prefs.valueForKey(bodyKey);

// --- 自动获取 Cookie 逻辑 ---
if (typeof $request !== "undefined") {
  const url = $request.url;
  const body = $request.body;
  if (body && body.indexOf("action=user_qiandao") !== -1) {
    $prefs.setValueForKey($request.headers["Cookie"], cookieKey);
    $prefs.setValueForKey(body, bodyKey);
    $.msg("MMios", "获取 Cookie 成功", "下次将自动执行定时签到");
  }
  $.done();
} else {
  // --- 定时签到逻辑 ---
  checkin();
}

function checkin() {
  if (!cookieVal || !bodyVal) {
    $.msg("MMios", "签到失败", "未获取到 Cookie 或 Body，请先手动签到一次");
    return $.done();
  }

  const request = {
    url: "https://www.mmios.net/wp-admin/admin-ajax.php",
    header: {
      "Cookie": cookieVal,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1",
      "Referer": "https://www.mmios.net/tuiguang",
      "X-Requested-With": "XMLHttpRequest"
    },
    body: bodyVal
  };

  $task.fetch(request).then(response => {
    try {
      const result = JSON.parse(response.body);
      if (result.status === "1") {
        $.msg("MMios", "签到成功", result.msg);
      } else {
        $.msg("MMios", "签到结果", result.msg || "未知错误");
      }
    } catch (e) {
      $.msg("MMios", "脚本错误", "解析响应失败");
    }
    $.done();
  }, reason => {
    $.msg("MMios", "网络错误", reason.error);
    $.done();
  });
}

// 简易环境适配
function Env(n) {
  this.msg = (t, s, m) => $notify(t, s, m);
  this.done = () => $done();
}
