const content = ```
<tw-storydata name="穿越异世界" startnode="12" creator="Twine" creator-version="2.7.1" format="Harlowe" format-version="3.3.7" ifid="56A77D0D-AA7A-42B9-BDC3-24F8FF349D4A" options="" tags="" zoom="1" hidden><style role="stylesheet" id="twine-user-stylesheet" type="text/twine-css"></style><script role="script" id="twine-user-script" type="text/twine-javascript"><\/script><tw-passagedata pid="1" name="60000" tags="" position="400,175" size="100,100">这是？啥地方？
[[继续-&gt;60001]]</tw-passagedata><tw-passagedata pid="2" name="60001" tags="" position="600,175" size="100,100">叮！恭喜宿主来到玄武大陆，身体原主人所在家族遭到仇家追杀，导致一家四口惨遭横祸。需要宿主找出原因并为原主讨回公道。
[[继续-&gt;60002]]</tw-passagedata><tw-passagedata pid="3" name="60002" tags="" position="600,300" size="100,100">啥玩意？关于我穿越到异世界为原主人报仇这件事！！
[[可是，我不想穿越啊，我该怎么回去。-&gt;60007]]
[[穿越了！！！这也太爽了吧-&gt;60005]]
[[这么荒唐，谁信啊，这一定是梦！-&gt; 60003]]</tw-passagedata><tw-passagedata pid="4" name="60999" tags="" position="575,775" size="100,100">异世界探索之旅开始。</tw-passagedata><tw-passagedata pid="5" name=" 60003" tags="" position="725,425" size="100,100">你认为这是一场梦，你选择：
[[试图让自己清醒过来，用力给自己一巴掌。-&gt;60004]]
[[一头往桌角撞去，让自己醒过来。-&gt;60998]]</tw-passagedata><tw-passagedata pid="6" name="60004" tags="" position="725,550" size="100,100">啪！！这么痛，还很清醒，难道真的不是梦。
[[继续-&gt;60008]]</tw-passagedata><tw-passagedata pid="7" name="60998" tags="" position="850,550" size="100,100">游戏结束。结局：游戏结束@意外身亡</tw-passagedata><tw-passagedata pid="8" name="60005" tags="" position="600,425" size="100,100">无论何时何地，仍能保持一个乐观的心态。&lt;red&gt;专注+1&lt;red&gt;。
[[继续-&gt;60999]]</tw-passagedata><tw-passagedata pid="9" name="60007" tags="" position="475,425" size="100,100">你的抱怨似乎没有得到任何回应。
[[继续-&gt;60999]]</tw-passagedata><tw-passagedata pid="10" name="60008" tags="" position="725,675" size="100,100">算了，还是先看看这地方吧。
[[继续-&gt;60999]]</tw-passagedata><tw-passagedata pid="11" name="61000" tags="" position="250,925" size="100,100">玄元大陆，叶落村。
[[继续-&gt;60000]]</tw-passagedata><tw-passagedata pid="12" name="99999" tags="" position="50,1025" size="100,100">玄元大陆。
[[叶落村-&gt;61000]]
[[不夜城-&gt;65000]]</tw-passagedata><tw-passagedata pid="13" name="65000" tags="" position="275,1075" size="100,100">玄元大陆，不夜城。</tw-passagedata></tw-storydata>```

const parser = new DOMParser()
const doc = parser.parseFromString(content)
console.log(doc)