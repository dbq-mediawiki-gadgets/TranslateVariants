# TranslateVariants
MediaWiki中文网站系统消息变体转换工具，修改自[Xi-Plus/MediaWiki-Gadget/TranslateVariants.js](https://github.com/Xi-Plus/MediaWiki-Gadget/blob/master/TranslateVariants.js)

本工具分为三个分支，其中<code>TranslateVariants-cnmusicwiki.js</code>为华语音乐百科小工具版本，<code>TranslateVariants-zhwiki.js</code>为中文维基百科用户工具版本，<code>TranslateVariants-global.js</code>为跨维基用户工具版本。

与Xi-Plus原版相比，具体改动内容如下：
<ol>
<li>使用OOUI重构界面，将变体输入文本框改为复选框形式，按钮交互/禁用启用逻辑更加合理，并增加简体中文显示支持。</li>
<li>遵循MediaWiki 1.41.0-wmf.15简化后的中文消息解析规则，只接受zh-hans、zh-hant和zh-hk三种变体的转换，不再提供其他变体选项，并为管理员提供“转换完成后自动删除已弃用变体子页面”的入口。</li>
<li>解析时按照系统消息的用字规则，将zh和zh-hans映射至zh-cn，将zh-hant映射至zh-tw，然后再传给API的uselang参数。</li>
<li>加入specialpages（特殊页面群）转换组，进一步提升转换准确率。</li>
<li>（针对华语音乐百科分支和中文维基百科分支）为所有通过该工具作出的编辑全部添加专属标签（复用旧版机器人标签），并进一步细化编辑摘要，方便在最近更改中追踪。</li>
</ol>
