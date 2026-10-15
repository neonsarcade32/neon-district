/* Visual-first vector game thumbnails: designed for the Neon District game catalog.
   All illustrations are self-contained SVG, no external network or image assets. */
(function(){
'use strict';
const themes=[
 ['#081e36','#12476a','#54e0ff','#dfff70'],['#24152f','#66365d','#ff9b77','#ffe39b'],
 ['#0a2931','#116663','#72f2d0','#a8e0ff'],['#181637','#463a7d','#b69aff','#68efff'],
 ['#1d2338','#4b4771','#ffaaba','#ffd889'],['#162b1f','#346344','#b4f47b','#77dfff']
];
const num=n=>Math.round(n*100)/100;
const rr=(x,y,w,h,f,r=0,extra='')=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+f+'" '+extra+'/>';
const circ=(x,y,r,f,extra='')=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+f+'" '+extra+'/>';
const line=(x1,y1,x2,y2,color,width=4,extra='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round" '+extra+'/>';
const path=(d,fill,extra='')=>'<path d="'+d+'" fill="'+fill+'" '+extra+'/>';
const poly=(points,fill,extra='')=>'<polygon points="'+points+'" fill="'+fill+'" '+extra+'/>';
const text=(x,y,txt,sz,color,extra='')=>'<text x="'+x+'" y="'+y+'" fill="'+color+'" font-family="Arial, sans-serif" font-weight="900" font-size="'+sz+'" '+extra+'>'+txt+'</text>';
const range=(n,fun)=>Array.from({length:n},(_,i)=>fun(i)).join('');
function car(x,y,accent,scale=1){
 return '<g transform="translate('+x+' '+y+') scale('+scale+')">'+
 path('M 18 37 L 32 14 Q 38 8 55 8 L 98 8 Q 107 8 116 20 L 134 36 L 138 57 L 10 57 Z',accent)+
 path('M 42 17 L 96 17 L 109 34 L 30 34 Z','#b9f5ff')+
 rr(17,47,114,9,'#06121f',4)+circ(35,60,12,'#071522')+circ(112,60,12,'#071522')+
 circ(35,60,5,'#879eac')+circ(112,60,5,'#879eac')+
 rr(13,35,10,8,'#fbefb1',2)+rr(123,35,10,8,'#ff6f75',2)+'</g>';
}
function hoop(x=340,y=100,accent='#ffcf73'){
 return rr(x-67,y-24,134,90,'#b8e9ee',5,'opacity=".28"')+rr(x-47,y-16,94,65,'none',1,'stroke="#f6ffff" stroke-width="4"')+
 path('M '+(x-42)+' '+(y+18)+' Q '+x+' '+(y+37)+' '+(x+42)+' '+(y+18),'none','stroke="'+accent+'" stroke-width="10"')+
 path('M '+(x-37)+' '+(y+25)+' L '+(x-24)+' '+(y+83)+' L '+(x+24)+' '+(y+83)+' L '+(x+37)+' '+(y+25),'none','stroke="#e8fdff" stroke-width="3" stroke-dasharray="9 7"');
}
function ball(x,y,r=28){return circ(x,y,r,'#ed8647')+path('M '+(x-r+5)+' '+y+' Q '+x+' '+(y-18)+' '+(x+r-5)+' '+y+' M '+x+' '+(y-r+4)+' L '+x+' '+(y+r-4)+' M '+(x-r+5)+' '+y+' Q '+x+' '+(y+18)+' '+(x+r-5)+' '+y,'none','stroke="#57311c" stroke-width="3"');}
function stadium(fg,light){return path('M 0 248 Q 300 145 560 248 L 560 330 L 0 330 Z','#071a28')+range(8,i=>line(i*80,280,i*80+68,250,light,2,'opacity=".5"'));}
function scene(id,c){
 const [base,mid,a,b]=c;
 switch(id){
 case 'offroad':{
  const sky=rr(0,0,560,300,'#103c55')+circ(420,64,51,'#ffe4a8','opacity=".84"')+
    path('M0 190 60 95 120 158 203 66 298 170 401 82 465 137 560 69 560 260 0 260Z','#214d5c')+
    path('M0 206 85 155 137 193 267 114 351 199 466 145 560 173 560 300 0 300Z','#316868')+
    path('M0 237 Q117 160 243 207 Q351 145 560 207 V300 H0Z','#507e55')+
    path('M0 257 126 193 222 227 370 162 560 218 V300 H0Z','#3d7555');
  const trail=path('M160 300 Q200 259 294 236 Q309 230 346 235 L432 300 Z','#b3a27d')+
    path('M195 300 Q224 260 286 249','none','stroke="#d3bf9a" stroke-width="3" opacity=".55"')+
    path('M432 300 Q381 261 342 252','none','stroke="#d3bf9a" stroke-width="3" opacity=".55"');
  const trees=range(6,i=>{const x=30+i*91,y=188+(i%3)*21,scale=i%2?.8:1.1;
   return '<g transform="translate('+x+' '+y+') scale('+scale+')">'+
    rr(-3,-22,6,42,'#6d593e',2)+
    poly('-20,-18 0,-65 20,-18','#0d5543')+poly('-18,-35 0,-77 18,-35','#15805d')+
    poly('-16,-50 0,-90 16,-50','#21aa7a')+'</g>'});
  const car='<g transform="translate(281 157)">'+
    path('M-91 57 -67 7 -30 -5 45 -5 80 8 98 56 96 92 -98 92Z','#102334','stroke="#9ff5ee" stroke-opacity=".85" stroke-width="4"')+
    path('M-68 19 -28 3 39 3 75 20 61 46 -63 46Z','#71e9f4')+
    path('M-60 24 -21 11 31 11 53 24','#d8ffff','stroke="#e1ffff" stroke-width="3" opacity=".35"')+
    path('M-88 59 -97 78 100 78 93 58 45 54 -55 54Z','#efffe0')+
    path('M-78 74 -62 69 -33 69 -39 85 -78 86Z','#d5ff69')+
    path('M33 69 70 70 78 84 39 84Z','#d5ff69')+
    path('M-51 88 56 88 64 95 -59 95Z','#385063')+
    rr(-101,43,15,54,'#0d1422',5)+rr(85,43,15,54,'#0d1422',5)+
    rr(-89,89,40,23,'#121824',7)+rr(51,89,40,23,'#121824',7)+
    path('M-57 43 Q-15 37 56 44','none','stroke="#8cffad" stroke-width="5"')+
    text(-74,116,'EXPLORE',15,'#eafff2','letter-spacing="3" opacity=".85"')+'</g>';
  return sky+trail+trees+car+text(28,46,'OPEN WORLD',31,'#f5ffff','letter-spacing="1" opacity=".97"')+
    text(28,67,'3D EXPEDITION',13,'#d5ff84','letter-spacing="3"');
 }

 case 'pixelhop':{
  let blocks=range(10,i=>rr(i*59,244+(i%3===0?-40:0),60,100,'#17384c',3,'stroke="#69d8ff" stroke-opacity=".4" stroke-width="2"'))+
   range(6,i=>rr(41+i*90,175+((i*7)%5)*12,66,14,'#5273aa',2,'stroke="#aacbff" stroke-opacity=".5"'))+
   range(15,i=>circ((i*53+38)%560,35+(i*61)%140,(i%3)+1,'#a2dfff'));
  const player=rr(190,118,49,72,'#6eacfa',5)+rr(199,130,31,24,'#e3f8ff',3)+
   rr(199,107,32,15,'#d3ff7d',1)+rr(203,146,8,6,'#172d47')+rr(221,146,8,6,'#172d47')+
   rr(180,154,13,18,'#96c2fc',2)+rr(239,154,13,18,'#96c2fc',2)+rr(201,189,12,18,'#1e3046',2)+rr(222,189,12,18,'#1e3046',2);
  const gem=poly('355,105 377,125 355,158 333,125','#d7ff79')+poly('355,110 366,125 355,147 345,125','#f6ffc8')+circ(355,125,47,'none','stroke="#d9ff79" stroke-width="3" opacity=".34"');
  const finish=rr(485,95,8,125,'#efffff',3)+poly('492,95 544,110 492,131','#ff93b2');
  return blocks+player+gem+finish+text(28,52,'PIXEL / HOP',35,'#ecfaff','letter-spacing="-1.2"');
 }
 case 'open2048':{
  const vals=[2,4,8,16,4,8,16,32,8,16,32,64,16,32,64,128];
  const palette=['#a7f5ff','#dcff87','#b2adff','#ffb9a4','#ff98ce','#75e8c5'];
  let tiles=rr(123,29,316,248,'#0c2438',17,'stroke="#7cdfff" stroke-opacity=".45" stroke-width="2"');
  for(let i=0;i<16;i++){const value=vals[i],x=136+(i%4)*76,y=40+Math.floor(i/4)*58;
   const bg=palette[Math.min(5,Math.floor(Math.log2(value))-1)%palette.length];
   tiles+=rr(x,y,67,49,bg,8,'stroke="#ecffff" stroke-opacity=".4" stroke-width="1.5"')+
   text(x+33.5,y+32,String(value),value>=100?23:29,'#162a3b','text-anchor="middle" letter-spacing="-1"');
  }
  return tiles+text(26,282,'MERGE / LEVEL UP',13,'#dfff9a','letter-spacing="2"');
 }
 case 'snake':return path('M 88 215 H 179 V 145 H 280 V 208 H 359 V 94 H 443','none','stroke="'+a+'" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"')+circ(444,94,21,b)+circ(451,87,5,'#112635')+circ(474,218,23,'#ff657c')+path('M 474 192 Q 477 180 488 175','none','stroke="#9cf68a" stroke-width="6"');
 case 'pong':return line(280,30,280,285,'#8aabc0',3,'stroke-dasharray="7 14"')+rr(78,110,14,91,a,7)+rr(470,65,14,91,b,7)+circ(315,140,15,'#fff9da')+line(339,140,413,95,a,5,'opacity=".35"')+text(218,76,'07',36,a)+text(315,76,'05',36,b);
 case 'reaction':return range(5,i=>circ(280,150,30+i*27,'none','stroke="'+a+'" stroke-width="2" opacity="'+(.7-i*.12)+'"'))+poly('297,35 211,169 273,169 232,262 367,118 305,118',b)+circ(282,152,28,a);
 case 'breakout':return range(7,i=>range(5,j=>rr(77+i*60,34+j*29,53,22,[(i+j)%2?a:b,mid,a,'#9e8cff','#f89c74'][(i+j)%5],4)))+poly('220,284 260,257 283,278 271,295', '#f7fff1')+rr(203,287,130,11,b,5);
 case 'flappy':return rr(94,-20,71,110,a,9)+rr(94,213,71,130,a,9)+rr(397,-20,71,143,a,9)+rr(397,246,71,120,a,9)+range(5,i=>circ(180+i*43,128+Math.sin(i)*13,5,'#e0f9ff','opacity=".7"'))+circ(283,168,37,b)+poly('309,165 352,175 309,189','#f58d66')+circ(290,155,6,'#142033')+path('M 252 179 Q 270 140 289 191 Q 265 211 252 179',a);
 case 'traffic':case 'highway':return poly('206,0 355,0 476,330 78,330','#172634')+range(8,i=>line(280-(i*4),i*43,280-(i*3),i*43+20,'#d3dc98',3))+car(255,95,a,.77)+car(121,195,b,.84)+car(344,237,'#9e92ff',.63);
 case 'tetris':return range(11,i=>{const blocks=[[1,5],[2,5],[3,5],[3,4],[4,4],[4,5],[5,4],[5,5],[6,3],[7,3],[7,4]][i];return rr(114+blocks[0]*37,20+blocks[1]*35,32,31,[a,b,'#e692ff','#77ffb5','#ff8e9d'][i%5],3)})+range(4,i=>rr(265+(i%2)*39,50+Math.floor(i/2)*37,34,32,b,3,'opacity=".7"'));
 case 'dino':return path('M 206 82 H 331 V 113 H 356 V 172 H 300 V 185 H 259 V 228 H 220 V 193 H 187 V 149 H 206 Z',a)+rr(269,106,9,10,'#071421',2)+line(302,195,304,249,a,13)+line(237,199,218,245,a,13)+range(3,i=>path('M '+(380+i*55)+' 254 V 213 L '+(393+i*55)+' 229 L '+(390+i*55)+' 254 Z',b))+line(0,254,560,254,'#b6d0ff',4);
 case 'space':case 'laser':return range(13,i=>circ((i*107+21)%560,(i*77+31)%290,i%3+1,'#dbefff','opacity=".7"'))+poly('280,57 218,218 280,195 342,218',a)+poly('280,102 258,180 302,180', '#eefaff')+poly('248,206 280,290 309,206','#ff964e')+line(193,72,176,117,b,5)+line(374,86,400,52,b,5)+range(3,i=>circ(139+i*140,65+i*26,14,'#b699ff'));
 case 'hockey':case 'breakaway':case 'goalkeeper':return rr(87,24,386,260,'#c6efff',35)+rr(115,45,330,215,'none',25,'stroke="#79a7c0" stroke-width="4"')+line(280,25,280,282,'#ff6c7a',4)+circ(280,150,52,'none','stroke="#5aafd8" stroke-width="4"')+rr(330,57,115,58,'#183653',3,'stroke="#fcffff" stroke-width="6"')+range(6,i=>line(340+i*17,60,340+i*17,114,'#e7ffff',1))+circ(id==='goalkeeper'?387:226,176,17,'#1d2330')+path('M 238 200 Q 288 144 351 125','none','stroke="#9b89f8" stroke-width="6" stroke-dasharray="8 9"');
 case 'drift':case 'turbo':case 'city':return range(7,i=>rr(38+i*76,182-(i%4)*33,57,200,'#0b2030',3))+range(16,i=>rr(49+(i%7)*76,197-(i%4)*32,8,8,a,1,'opacity=".8"'))+poly('0,245 560,232 560,330 0,330','#152330')+line(0,270,560,250,b,5,'stroke-dasharray="32 26"')+car(201,180,a,1.35);
 case 'ski':return poly('40,260 189,35 330,260','#d6ecf8')+poly('199,260 366,49 549,260','#aacadf')+poly('189,36 233,97 165,85','#ffffff')+line(0,275,560,275,'#e6fbff',6)+path('M 282 143 L 240 205 L 307 229','none','stroke="'+b+'" stroke-width="11" stroke-linecap="round"')+circ(280,126,17,a)+line(237,248,312,260,'#193b5b',6)+line(225,245,315,251,'#193b5b',6)+poly('110,163 145,163 145,226 132,226',a)+poly('410,147 447,147 447,218 428,218',b);
 case 'basketball':case 'freethrow':return stadium(a,b)+hoop(335,70,b)+ball(170,218,37)+path('M 188 194 Q 258 88 299 106','none','stroke="#fff3b5" stroke-width="6" stroke-dasharray="10 12"');
 case 'qb':case 'fieldgoal':return stadium(a,b)+line(0,248,560,248,'#9ae7b2',7)+path('M 212 230 Q 275 60 445 115','none','stroke="'+b+'" stroke-width="5" stroke-dasharray="13 13"')+poly('169,169 234,145 268,167 230,193','#8a5333')+line(205,150,232,185,'#eaf5ef',4)+line(203,174,246,166,'#eaf5ef',3)+(id==='fieldgoal'?line(421,40,421,176,b,10)+line(358,40,358,112,b,9)+line(358,112,421,112,b,6):circ(422,117,21,a));
 case 'derby':return stadium(a,b)+path('M 190 260 Q 276 130 355 260 L 276 320 Z','#7fbb71')+circ(280,181,35,'#fdfdfa')+path('M 253 156 Q 280 181 253 211 M 307 156 Q 280 181 307 211','none','stroke="#ff8176" stroke-width="4" stroke-dasharray="5 5"')+line(157,261,404,78,b,13);
 case 'idle':return range(6,i=>rr(87+i*64,245-(i%3)*56,48,150+(i%3)*56,['#527ad1','#42638b','#597b96'][i%3],5))+range(13,i=>rr(101+(i%6)*64,200+Math.floor(i/6)*32,12,13,b,2))+circ(330,93,60,b)+text(303,109,'$',56,'#182d30');
 case 'tap':return range(5,i=>circ(286,161,41+i*27,'none','stroke="'+a+'" stroke-width="3" opacity="'+(1-i*.18)+'"'))+circ(286,160,54,b)+text(262,180,'1',57,'#112539')+circ(119,81,14,a)+circ(478,233,13,'#e0adff');
 case 'minigolf':return path('M 60 280 Q 180 76 382 117 T 570 50 L 560 330 L 0 330 Z','#186b57')+circ(415,152,17,'#091b20')+line(415,152,415,36,'#f3fcff',5)+poly('415,38 485,60 415,84',b)+circ(173,232,24,'#f3faff')+path('M 199 226 Q 310 118 390 152','none','stroke="#e5fff6" stroke-width="5" stroke-dasharray="9 12"');
 case 'meteor':return range(14,i=>circ((i*127+32)%560,(i*73+14)%290,i%3+2,'#d6f3ff'))+poly('242,222 279,150 322,222 302,215 293,241 258,241',a)+range(3,i=>path('M '+(90+i*133)+' '+(32+i*32)+' L '+(176+i*117)+' '+(84+i*42)+' L '+(127+i*127)+' '+(110+i*34)+' Z',i%2?b:'#ff9a7b','opacity=".9"'))+line(280,255,280,289,b,12);
 case 'stack':return range(7,i=>rr(180+(i%4)*17,246-i*29,200-i*19,25,[a,b,'#a88fff'][i%3],3));
 case 'penalty':return rr(84,38,392,190,'none',3,'stroke="#f3ffff" stroke-width="10"')+range(9,i=>line(85+i*49,39,85+i*49,225,'#dcf6ff',2,'opacity=".45"'))+range(5,i=>line(90,45+i*38,470,45+i*38,'#dcf6ff',2,'opacity=".3"'))+ball(263,253,28)+path('M 293 234 Q 366 150 393 125','none','stroke="'+a+'" stroke-width="7" stroke-dasharray="12 12"');
 case 'circuit':return range(8,i=>line(110+(i%4)*108,60+Math.floor(i/4)*142,168+(i%4)*74,113+Math.floor(i/4)*86,a,5))+range(11,i=>circ(80+(i%6)*85,80+Math.floor(i/6)*115,12,i%2?a:b))+rr(243,123,79,62,'#112844',7,'stroke="'+b+'" stroke-width="5"')+text(257,161,'CPU',24,'#e4fffa');
 case 'bowling':return poly('233,0 329,0 475,310 92,310','#ad7c65')+range(7,i=>line(272-(i*18),0,208-i*29,310,'#e5b58c',2,'opacity=".35"'))+range(6,i=>{const x=254+(i%3)*26,y=55+Math.floor(i/3)*31;return rr(x,y,14,31,'#f6f9ff',5)+rr(x,y+8,14,5,'#ff6d7d')})+circ(284,238,51,a)+circ(270,215,7,'#132233')+circ(295,217,7,'#132233');
 case 'beattiles':return range(6,i=>rr(94+i*68,12,57,310,'#101a33',2,'stroke="#405979" stroke-width="2"'))+range(7,i=>rr(95+(i%6)*68,30+i*31,55,25,i%2?a:b,2)) +line(87,261,516,261,'#fbfcff',5);
 case 'claw':return rr(121,29,323,238,'none',15,'stroke="'+a+'" stroke-width="10"')+line(281,31,281,109,b,7)+path('M 249 113 L 249 137 L 267 165 M 313 113 L 313 137 L 295 165','none','stroke="#d6efff" stroke-width="8" stroke-linecap="round"')+circ(281,125,21,b)+circ(230,225,27,'#ff9eaa')+circ(335,223,29,'#b1f6be')+circ(285,248,24,'#c2a5ff');
 case 'colordash':return range(6,i=>poly((i*94)+',0 '+(i*94+91)+',0 '+(i*94+58)+',330 '+(i*94-35)+',330',[a,b,'#ff8da7','#ba98ff','#7cebc4','#92befd'][i]))+circ(284,184,37,'#151e32')+circ(284,184,19,'#ffffff');
 case 'rooftop':return range(6,i=>rr(25+i*105,120+(i%3)*25,85,245,'#122c43',5))+range(8,i=>rr(45+(i%6)*105,153+(i%3)*24,18,11,a,2))+circ(290,83,17,b)+line(290,104,270,153,b,12)+line(270,153,312,178,b,11)+line(271,129,224,141,b,10)+line(277,149,252,182,b,10);
 default:return circ(280,145,91,a)+circ(280,145,69,'none','stroke="'+b+'" stroke-width="12"')+text(257,165,'▶',54,'#101a30');
 }
}
function render(id,name,cat){
 const key=String(id||'');const hash=key.split('').reduce((a,c)=>a+c.charCodeAt(0),0),colors=themes[hash%themes.length],n=key.replace(/[^a-z0-9]/g,'');
 const [base,mid,a,b]=colors,art=scene(key,colors);
 const outer='<svg class="nd3-illustration" viewBox="0 0 560 300" role="img" aria-label="'+String(name||key).replace(/&/g,'&amp;').replace(/"/g,'&quot;')+' artwork" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">';
 const defs='<defs><linearGradient id="bg-'+n+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+base+'"/><stop offset=".8" stop-color="'+mid+'"/></linearGradient><radialGradient id="gl-'+n+'"><stop stop-color="'+a+'" stop-opacity=".19"/><stop offset="1" stop-color="'+a+'" stop-opacity="0"/></radialGradient></defs>';
 const plate=rr(0,0,560,300,'url(#bg-'+n+')')+circ(424,48,240,'url(#gl-'+n+')')+range(8,i=>line(0,i*41,560,i*41,'#e2f7ff',.7,'opacity=".06"'))+range(11,i=>line(i*55,0,i*55,300,'#e2f7ff',.7,'opacity=".045"'));
 const deco=rr(12,12,536,276,'none',8,'stroke="#f1f7ff" stroke-opacity=".14" stroke-width="1"')+text(24,280,'ND  /  ARCADE 03',12,'#f1f7ff','letter-spacing="2" opacity=".7"')+text(527,280,cat.toUpperCase(),11,'#f1f7ff','text-anchor="end" letter-spacing="1" opacity=".67"');
 return outer+defs+plate+art+deco+'</svg>';
}
window.ND3Art={render};
})();