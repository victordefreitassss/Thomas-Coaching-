'use strict';
module.exports=function(req,res){
 const room=new URL(req.url,'https://app.local').searchParams.get('espace');
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('Referrer-Policy','no-referrer');
 if(!/^[A-Za-z0-9_-]{32}$/.test(room||'')){res.statusCode=400;res.end('Accès invalide');return;}
 res.setHeader('Content-Type','application/manifest+json; charset=utf-8');
 res.end(JSON.stringify({name:'Natif Body | Suivi évolutif',short_name:'Natif Body',id:'/app/'+room,start_url:'/app/'+room,scope:'/',display:'standalone',background_color:'#f5f5f7',theme_color:'#101014',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icon-512.png',sizes:'512x512',type:'image/png'}]}));
};
