// 	/*
// 	 * Framework socket.io
// 	 */
	var socket = io();
	socket.on('newEvent', function() {
		$scope.showEvents();
	});

	socket.on('showPost', function(media) {
		var html = "<article class='post'><div class='view loaded'><img class='media' src='/uploads/" + media  + "'" + " alt='Nueva Imagen' width='100%' height='100%'></div></article>";
		document.getElementById('newSendPost').innerHTML = html;
	});

	socket.on('showInChannel', function(media) {
		var html = "<img src=' " + media  + " ' " + " alt='Nueva Imagen' width='70%' height='70%'>";
		document.getElementById('newSendPost').innerHTML = html;
	});

var EMPTY_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

$(function() {
    FastClick.attach(document.getElementById('box'));
});

//
//	Código de maquetación
//

$('#share-new-post .share').on('click', function() {
	$(this).toggleClass('selected');
});

$('input.post-tag').on('focus', function() {
	$('body').addClass('view-menu-hidden');
});

$('input.post-tag').on('focusout', function() {
	$('body').removeClass('view-menu-hidden');
});

$('body').bind('keydown', function(event) {
	if(event.keyCode == 13) {
		if($('input#title').is(':focus')) {
			$('input#title').blur();
		} else {
			$('input#title').focus();
		}
	}
});

//Variables used by cordova for access to the device camera
var pictureSource;   // picture source
var destinationType; // sets the format of returned value

// Wait for device API libraries to load
document.addEventListener("deviceready",onDeviceReady,false);

// device APIs are available
function onDeviceReady() {
    pictureSource=navigator.camera.PictureSourceType;
    destinationType=navigator.camera.DestinationType;
}

// Called when a photo is successfully retrieved
function onPhotoDataSuccess(imageData) {
	var canvas = document.getElementById('new-media-preview');
	var ctx = canvas.getContext('2d');
	$('body').addClass('new-post-view');
	scrollTo($('#post-preview'));
	var img = new Image();
	img.onload = function() {
		var nTam = 1080;
		canvas.width = nTam;
		canvas.height = nTam;
		var nWidth = nTam;
		var nHeight = nTam;
		var variation = {a: 0, desX: 0, desY: 0, cntX: -1, cntY: 0, swt:false};
		if(img.width > img.height) {
			nWidth = img.width * nTam / img.height;
		} else if(img.width < img.height) {
			nHeight = img.height * nTam / img.width;
			variation = {a: 0, desX: 0, desY: 0, cntX: 0, cntY: -1, swt:false};
		}
		variation.width = nWidth;
		variation.height = nHeight;
		if(variation.swt) {
			variation.width = nHeight;
			variation.height = nWidth;
		}
		var cntVar = 0;
		if (variation.width > nTam) {
			cntVar = parseInt((variation.width - nTam)/2);
		}
		if (variation.height > nTam) {
			cntVar = parseInt((variation.height - nTam)/2);
		}
		var xPoint = (nWidth*variation.desX) + cntVar*variation.cntX;
		var yPoint = (nHeight*variation.desY) + cntVar*variation.cntY;
		ctx.rotate(variation.a*Math.PI/180);
		ctx.drawImage(img,xPoint,yPoint,nWidth,nHeight);
		$(canvas).parent('.view').addClass('loaded');
		var mobile = ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )?true:false;
		var imgQuality = mobile?0.75:0.75; // 0.5:0.75
		var newImg = canvas.toDataURL( 'image/jpeg' , imgQuality );
		getGeo(function(coords) {
			app.newPost.media = imageData;
			app.newPost.coords = {};
			app.newPost.coords.latitude = coords.latitude;
			app.newPost.coords.longitude = coords.longitude;
		}, function() {
		});
	}
	img.src = "data:image/jpeg;base64," + imageData;
}

// Take picture using device camera, allow edit, and retrieve image as base64-encoded string
function capturePhotoEdit() {
  navigator.camera.getPicture(onPhotoDataSuccess, onFail, { quality: 20, allowEdit: true, saveToPhotoAlbum: true,
    destinationType: destinationType.DATA_URL });
}

// Called if something bad happens.
function onFail(message) {
  alert('Failed because: ' + message);
}

function popupwindow(url, title, w, h) {
	wLeft = window.screenLeft ? window.screenLeft : window.screenX;
	wTop = window.screenTop ? window.screenTop : window.screenY;
	var left = wLeft + (window.innerWidth / 2) - (w / 2);
	var top = wTop + (window.innerHeight / 2) - (h / 2);
	return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', heigh=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
}

$(document).ready(function() {
	$('.pop-up').click(function(event) {
		if(!( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )) {
			event.preventDefault();
			url = $(this).attr('href');
			popupwindow(url, 'Acceso Juaku', 530, 300);
			return false;
		} else {
			event.preventDefault();
			document.location = $(this).attr('href');
		}
	});
});

function postsLoaded() {
	$('.save').off('click');
	$('.save').on('click', function(event) {
		$('body').toggleClass('dark');
		alert('');
	});

	$('.author-hex-code').each(function(index) {
		$(this).css('background-color', '#' + $(this).attr('hex-code'));
	});

	// Restringe el uso de espacios, @ y cualquier otro caracter que no esté en la expresión regular al escribir el nombre del evento
	//
	$(".post-tag").bind('keypress', function(event) {
		var regex = new RegExp("[A-Z0-9a-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß]+");
		var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
		if (!regex.test(key)) {
			event.preventDefault();
		}
	});
}

$(document).scroll(function() {
	checkScroll('html');
});

var gettingPosts = false;
var sendingPost = false;
var endOfList = false;
var queryStart = -1;
var numEmptyPosts = 0;
var domain = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;

var lastScrollPosition = 0;
var maxScrollDown = 0;
var minScrollDown = 9999;
var minScrollDirection = 20;

function checkScroll(target) {
	if($(target).scrollTop()*1.5 >= $(target).prop('scrollHeight') && !gettingPosts) {
		app.router();
	}
	/* ScrollUp */
	var diffScroll = $(target).scrollTop() - lastScrollPosition;
	if (diffScroll > 0) {
		if(maxScrollDown < $(target).scrollTop()) {
			maxScrollDown = $(target).scrollTop();
		}
		if($(target).scrollTop() - minScrollDown > minScrollDirection) {
			$('#box').removeClass('scrollingUp');
			minScrollDown = 9999;
		}
	} else {
		if(minScrollDown > $(target).scrollTop()) {
			minScrollDown = $(target).scrollTop();
		}
		if(maxScrollDown - $(target).scrollTop() > minScrollDirection) {
			$('#box').addClass('scrollingUp');
			maxScrollDown = 0;
		}
	}

	lastScrollPosition = $(target).scrollTop();
}

Vue.directive('novetwo', function (el, binding) {
  console.log(el,binding);
})

var app = new Vue({
	el: '#box',
	data: {
		user: localStorage.getItem('user')?JSON.parse(localStorage.getItem('user')):null,
		route: null,
		posts: localStorage.getItem('token')?createEmptyPosts(0):createEmptyPosts(3),
		newPost: {
			shareOnFb: false
		},
		oldTag: null,
		newTag: null,
		suggestedTags: [],
		lastWordSuggested: null
	},
	http: {
		headers: {
			Authorization: 'Bearer ' + token
		}
	},
	methods: {
		router: function(route, event) {
			if(route) {
				route = decodeURI(route);
			}
			if(event) {
				event.preventDefault();
			}
			gettingPosts = true;

			var newRoute = route;
			var pushToHistory = false;
			if(route == undefined) {
				if(endOfList)
					return;
				queryStart++;
				var emptyPosts = createEmptyPosts(0);
				for(post in emptyPosts) {
					this.posts.push(emptyPosts[post]);
				}
				newRoute = this.route;
			} else {
				queryStart = 0;
				endOfList = false;
				this.posts = createEmptyPosts(0); // TODO: Analizar
				if(this.route == null) {
					pushToHistory =  false;
				} else {
					pushToHistory =  true;
				}
				newRoute = route;
			}

			this.route = newRoute;

			this.refresh(newRoute, function() {
				var state = {
					'posts': app.posts,
					'route': app.route,
					'queryStart': queryStart};
				if(pushToHistory) {
					history.pushState(state, null, app.route);
				} else {
					history.replaceState(state,null, app.route);
				}
				gettingPosts = false;
			}, function(e) {
			});
		},
		loaded: function(post) {
			if(post.media != EMPTY_IMAGE) {
				post.class = 'loaded';
			}
		},
		refresh: function(route, next, error) {
			query(route, function (data) {
				if(data) {
					for (var i = 0; i < data.length; i++) {
						var aux = data[i];
						aux.class = '';
						aux.tools = false;
						aux.timeFromNow = moment(data[i].time).fromNow();
						if(numEmptyPosts > 0) {
							Vue.set(app.posts, app.posts.length - numEmptyPosts, aux);
							numEmptyPosts--;
						} else {
							app.posts.push(aux);
						}
					}
				}

				if(!data || data.length < 10) {
					endOfList = true;
					$('#end').addClass('show');
				}
				
				while(numEmptyPosts > 0) {
					app.posts.pop();
					numEmptyPosts--;
				}

				if(queryStart == 0 && route!='') {
					// TODO: Hack para esperar al render del DOM
					setTimeout(function() {
						scrollTo($('article.post').first());
					}, 1);
				}

				next();
			}, function(e) {
				// app.router(''); Bucle
				// window.location = '/logout'; // TODO: ¿Qué hacer con estos errores?
				error();
			});
		},
		reload: function() {
			//window.location.href = 'index.html';
			window.location = '/'
		},
		scroll: function() {
			checkScroll('main');
		},
		take: function() {
			//capturePhotoEdit();
			$('input#media-loader').click();
		},
		up: function() {
			setTimeout(function() {
				$('main, html, body').stop().animate({ // Se necesita html en vez de o con body en escritorio
					'scrollTop':  0
				}, 300);
				//scrollTo($('#start'));
			}, 50); // Hack: Se espera 50ms para que no se cruce con el 'scroll' del usuario
		},
		sendNewPost: function(event) {
			if (confirm('¿Desear enviar el post?')) {
				event.preventDefault();
				if(!sendingPost) {
					sendingPost = true;
					this.$http.post(domain + '/post/new', this.newPost,
						{ headers: { Authorization: 'Bearer ' + token }}).then(function(data) {
						socket.emit('showPost', data.body);
						sendingPost = false;
						$('body').removeClass('new-post-view');
					}, function(res)  {
						$('body').removeClass('new-post-view');
					});
				}
			}
		},
		assistedScroll: function(event) {
			var postObject = $(event.target).parents('.post');
			scrollTo(postObject, $(postObject).next());
		},
		updateState: function(state) {
			if(!state)
				return;
			this.route = state.route;
			queryStart = state.queryStart;
			this.posts = [];
			for(post in state.posts) {
				state.posts[post].class = 'loaded'; // Hack de error Vue.js en popstate
		 		this.posts.push(state.posts[post]);
			}
		},
		togglePostTools: function(post) {
			if (!post.tools) {
				post.tools = true;
			} else {
				post.tools = false;
			}
		},
		savePost: function(post) {
			if(!post.edittable) {
				if (!post.saved) {
					post.saved = true;
					this.$http.post(domain + '/post/save', post,
						{ headers: { Authorization: 'Bearer ' + token }}).then(function(data) {
						socket.emit('showPostSaved', data.body);
					},function(e) {
					});
				} else {
					post.saved = false;
					console.log(post);
					this.$http.post(domain + '/post/unsave', post,
						{ headers: { Authorization: 'Bearer ' + token }}).then(function(data) {
					},function(e) {
					});
				}
			}
		},
		sharePost: function(post) {
			this.$http.post(domain + '/post/shareActionOnFb', post,
						{ headers: { Authorization: 'Bearer ' + token }}).then(function(data) {
			},function(e) {
			});
		},
		deletePost: function(post) {
			if(post.edittable) {
				if(confirm("Seguro que desas borrar este post?")) {
					this.$http.post(domain + '/post/deletePost', post,
						{ headers: { Authorization: 'Bearer ' + token }}).then(function(data) {
					},function(e) {
					});
				}
			}
		},
		modifyTag: function(post) {
			post.editedTag = true;
			post.tagToBeChanged = post.tag;
		},
		updateTag: function(post) {
			post.oldTag = post.tag;
			var pathRegExp = new RegExp(/(^[0-9A-Za-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß%]{3,})$/g);
			var bool = pathRegExp.test(post.newTag); // false o true
			if(post.newTag != '' && post.newTag != undefined) {
				if(bool) {
					simplifyName(post.newTag, function(tag) {
						post.tag = tag; // Cuando se haga click sobre el tag, apuntará hacia el nuevo post
					});
					post.tag = post.newTag; // Muestra el tag cambiado
					post.editedTag = false;
					this.$http.post(domain + '/post/updateTag', post,
						{ headers: { Authorization: 'Bearer ' + token }}).then(function() {
					},function(e) {
					});
				} else {
					post.editedTag = false;
					alert('Tag no permitido');
				}
			} else {
				post.editedTag = false;
				alert('Tag no permitido');
			}
		},
		changeLanguage: function(language) {
			// TODO: No cambia el idioma, revisar
			var object = {};
			object.language = language;
			this.$http.post(domain + '/user/changeLanguage', object,
						{ headers: { Authorization: 'Bearer ' + token }}).then(function() {
			},function(e) {
			});
		},
		suggest: function(word) {
			console.log('word: ' + word);
			var pathRegExp = new RegExp(/(^@[0-9A-Za-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß%]{1,})$/g);
			var bool = pathRegExp.test(word); // false o true
			if(bool) {
				if(app.lastWordSuggested != word) {
					app.lastWordSuggested = word;
					simplifyName(word, function(tag) {
						app.$http.get('/list/search/q/' + tag).then(function(res) {
							app.suggestedTags = res.body;
							console.log(app.suggestedTags);
						},function(e) {
						});
					});
				}
			}
		},
		reportPost: function(post) {
			if(!post.edittable) {
				if(confirm("Seguro que desas reportar este post?")) {
					this.$http.post(domain + '/post/reportPost', post,
						{ headers: { Authorization: 'Bearer ' + token }}).then(function() {
					},function(e) {
					});
				}
			}
		},
		postURL: function(post) {
			app.router('p/' + post.id);
		},
		setNewMedia: function(event) {
			var canvas = document.getElementById('new-media-preview');
			var ctx = canvas.getContext('2d');
			$('body').addClass('new-post-view');
			scrollTo($('#post-preview'));
			if(event.target.files[0]) {
				EXIF.getData(event.target.files[0], function() {
					var orientation = this.exifdata.Orientation;
					var reader = new FileReader();
					reader.onload = function(event) {
						var img = new Image();
						img.onload = function() {
							var nTam = 1080;
							canvas.width = nTam;
							canvas.height = nTam;
							var nWidth = nTam;
							var nHeight = nTam;
							var variation = {a: 0, desX: 0, desY: 0, cntX: -1, cntY: 0, swt:false};
							if(img.width > img.height) {
								nWidth = img.width * nTam / img.height;
							} else if(img.width < img.height) {
								nHeight = img.height * nTam / img.width;
								variation = {a: 0, desX: 0, desY: 0, cntX: 0, cntY: -1, swt:false};
							}

							switch(orientation) {
								case 3:
									variation = {a: 180, desX: -1, desY: -1, cntX: 1, cntY: 0, swt:false};
									break;
								case 6:
									variation = {a: 90, desX: 0, desY: -1, cntX: -1, cntY: 0, swt:true};
									break;
								case 8:
									variation = {a: -90, desX: -1, desY: 0, cntX: 1, cntY: 0, swt:true};
									break;
							}
							
							variation.width = nWidth;
							variation.height = nHeight;
							if(variation.swt) {
								variation.width = nHeight;
								variation.height = nWidth;
							}
							var cntVar = 0;
							if (variation.width > nTam) {
								cntVar = parseInt((variation.width - nTam)/2);
							} 
							if (variation.height > nTam) {
								cntVar = parseInt((variation.height - nTam)/2);
							}
							var xPoint = (nWidth*variation.desX) + cntVar*variation.cntX;
							var yPoint = (nHeight*variation.desY) + cntVar*variation.cntY;
							ctx.rotate(variation.a*Math.PI/180);
							ctx.drawImage(img,xPoint,yPoint,nWidth,nHeight);
							$(canvas).parent('.view').addClass('loaded');
							var mobile = ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )?true:false;
							var imgQuality = mobile?0.75:0.75; // 0.5:0.75
							var newImg = canvas.toDataURL( 'image/jpeg' , imgQuality );
							getGeo(function(coords) {
								app.newPost.media = newImg;
								app.newPost.coords = {};
								app.newPost.coords.latitude = coords.latitude;
								app.newPost.coords.longitude = coords.longitude;
							}, function() {
							});
							//getGeo( function() {
							//	$('#positionMap img').attr('src','http://maps.googleapis.com/maps/api/staticmap?zoom=15&size=500x100&markers=color:red|' + $scope.newAction.coords.latitude + ',' + $scope.newAction.coords.longitude);
							//}, function(errorMsg) {
							//	console.log(errorMsg);
							//});
						}
						img.src = event.target.result;
					}
					reader.readAsDataURL(event.target.files[0]);
				});
			}
		},
		shareOnFb: function() {
			this.newPost.shareOnFb = !this.newPost.shareOnFb;
		},
		back: function() {
			history.back();
		},
		more: function() {
			$('aside').toggleClass('show');
		},
		changeTheme: function(event) {
			$('body').toggleClass('dark');
		},
		setGeo: function() {
			getGeo(function(coords) {
				app.$http.post(domain + '/user/setGeo', coords,
					{ headers: { Authorization: 'Bearer ' + token }}).then(function() {
				}, function(){
				});
			}, function() {
			});
		},
		logout: function() {
			/*if(navigator.serviceWorker) {
				navigator.serviceWorker.getRegistrations().then(function(registrations) {
					for (var i = 0; i < registrations.length; i++) {
						registrations[i].unregister();
					}
				})
			}*/
			localStorage.removeItem('user');
			localStorage.removeItem('token');
			localStorage.removeItem('locale');
			window.location = '/logout';
			//window.location.reload(true);
		},
		login: function() {
			var fbLoginSuccess = function (userData) {
				app.$http.get(domain + '/auth/facebook/token?access_token=' + userData.authResponse.accessToken).then(function(res) {
					user = res.body.user;
					token = res.body.token;
					localStorage.setItem('user', JSON.stringify(res.body.user));
					localStorage.setItem('locale', res.body.locale);
					localStorage.setItem('token', res.body.token);
					window.location.reload(true);
				}, function(res)  {
					error(res);
				});
			}
			facebookConnectPlugin.login(["public_profile"], fbLoginSuccess,
				function loginError (error) {
					console.error(error)
				}
			);
		}
	}
});

function query(route, next, error) {
	if(route) {
		validateName(route, function(routeSimple) {
			route = routeSimple;
		}, function(e) {
			console.log('URL no permitida');
			window.location = '/logout'; // TODO: ¿Qué hacer con estos errores?
		});
	}
	console.log('route!!');
	console.log(route);
	token = localStorage.getItem('token');
	app.$http.get(domain + '/list/' + [route, queryStart].join('/'),
		{ headers: { Authorization: 'Bearer ' + token }}).then(function(res) {
		socket.emit('joinChannel', route);
		next(res.body.posts);
	}, function(res)  {
		error(res);
	});
}

function createEmptyPosts(n) {
	var emptyPosts = []
	numEmptyPosts = n;
	for (var i = 0; i < n; i++) {
		emptyPosts[i] = {
			'media': EMPTY_IMAGE,
			'event':'',
			'time':'',
			'class':'',
			'author':{
				'firstName':'',
				'lastName':'',
				'picture': EMPTY_IMAGE
			},
		};
	}
	return emptyPosts;
}

var scrollTime = Date.now();
function scrollTo(object, nextObject) {
	//setTimeout(function() {
		var directScroll = (typeof nextObject === 'undefined') ? true : false;
		var thisTop = $(object).offset().top;
		var nextTop = !directScroll ? $(nextObject).offset().top : 0;
		var scrollCorrection = 0;
		var scrollToNext = false;
		var headerHeight = $('#side').height();

		if($(object).parents('body').height() <= 520) {
			if($(object).parents('#box').hasClass('scrollingUp')) {
				thisTop -= headerHeight;
				nextTop -= headerHeight;
			}
			headerHeight = 0;
		}

		if(window.innerWidth <= 480) {
			//scrollToNext = (Math.abs(thisTop) < 1 + headerHeight); // TODO: ¿Error?
			// TODO: El ceil para 51.25 a 52
			scrollToNext = (Math.abs(Math.ceil(thisTop)) == headerHeight);
			scrollingElement = 'main'
			scrollCorrection = $(scrollingElement).scrollTop() - headerHeight;
		} else {
			scrollToNext = (Math.abs(thisTop - $(window).scrollTop()) < 1);
			scrollingElement = 'html, body';
		}

		var scrollTo = scrollCorrection;

		if(directScroll) {
			scrollTo += thisTop;
		} else {
			scrollTo += (scrollToNext ? nextTop : thisTop);
		}

		/*$(scrollingElement).stop().animate({
			'scrollTop':  Math.ceil(scrollTo)
		/*}, 50, function() {
			//window.location.hash = refPost; // TODO: Actualizar hash
		});*/
		$(scrollingElement).scrollTop(Math.ceil(scrollTo));

		// Prevenir que el auto scroll revele la barra superior
		if(!directScroll) {
			// TODO: Hack para evitar que se adiera la clase
			setTimeout(function() {
				$(object).parents('#box').removeClass('scrollingUp');
			}, 5);
		}

		//setTimeout( function() {
			//$('#title').val($('#title').val()); // Hack para forzar Vue a renderizar. Evita fotograma corrupto.
		//}, 50); // Hack: Se espera 50ms para que no se cruce con el 'scroll' del usuario
}

function validateName(pathname, next, error) {
	var pathRegExp = new RegExp(/^((?:[0-9A-Fa-f]{3})\.(?:[A-Za-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß%]{3,}))?(?:@([0-9A-Za-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß%]{3,}))?$|^([0-9A-Za-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß%]{3,})$|^([p\/0-9a-fA-F]+)$/g);
	var path = pathRegExp.exec(pathname);
	var userId, hexCode, nameUser, tagName, channelRequest, userRequest, tagRequest, post;
	if(path[0]) {
		if(path[1]) {
			if(path[2]) {
				//Channel
				userId = path[1].split('.')
				hexCode = userId[0];
				simplifyName(userId[1], function(nameuser) {
					nameuser = nameuser;
					simplifyName(path[2], function(tagName) {
						tagName = tagName;
						channelRequest = hexCode + '.' + nameuser + '@' + tagName;
						next(channelRequest);
					});
				});
			} else {
				//User
				userId = path[1].split('.')
				simplifyName(userId[0], function(hexCode) {
					hexCode = userId[0];;
					simplifyName(userId[1], function(nameuser) {
						nameuser = nameuser;
						userRequest = hexCode + '.' + nameuser;
						next(userRequest);
					});
				});
			}
		} else {
			if(path[2]) {
				//Tag
				simplifyName(path[2], function(tag){
					tagRequest = '@' + tag;
					next(tagRequest);
				});
			} else if(path[3]) {
				//solo una palabra
				simplifyName(path[3], function(tag){
					next(tag);
				});
			} else if(path[4]) {
				//Post
				post = path[4];
				next(post);
			}
		}
	} else {
		console.log('No permitido');
		error();
	}
}

function simplifyName(tag, next) {
	var diacritics = [
		{re:/[\xC0-\xC6]/g, ch:'A'},
		{re:/[\xE0-\xE6]/g, ch:'a'},
		{re:/[\xC8-\xCB]/g, ch:'E'},
		{re:/[\xE8-\xEB]/g, ch:'e'},
		{re:/[\xCC-\xCF]/g, ch:'I'},
		{re:/[\xEC-\xEF]/g, ch:'i'},
		{re:/[\xD2-\xD6]/g, ch:'O'},
		{re:/[\xF2-\xF6]/g, ch:'o'},
		{re:/[\xD9-\xDC]/g, ch:'U'},
		{re:/[\xF9-\xFC]/g, ch:'u'},
		{re:/[\xD1]/g, ch:'N'},
		{re:/[\xF1]/g, ch:'n'},
		{re:/[\307]/g, ch:'C'},
		{re:/[\347]/g, ch:'c'}
	];
	for (var i = 0; i < diacritics.length; i++) {
		tag = tag.replace(diacritics[i].re, diacritics[i].ch);
	}
	next(tag.toLowerCase());
}

app.setGeo();
if(window.location.pathname.substring(1) != '') {
	app.router(window.location.pathname.substring(1)); //llama a router cuando se usa la url en escritorio para buscar
}
app.router();

/*if ('serviceWorker' in navigator) {
	console.log('CLIENT: service worker registration in progress.');
	navigator.serviceWorker.register('/service-worker.js').then(function() {
		console.log('CLIENT: service worker registration complete.');
	}, function() {
		console.log('CLIENT: service worker registration failure.');
	});
} else {
	console.log('CLIENT: service worker is not supported.');
}*/

//
// Framework Angular
//

//app.user = {};
//app.user.data = {};

// function Application($scope, $http, $window) {
// 	// Modelo User
// 	//
// 	$scope.modifyTag = function(action) {
// 		action.editing = true;
// 		$scope.oldTag = action.tag;
// 	}
// 	$scope.updateTag = function(action) {
// 		action.oldTag = $scope.oldTag;
// 		action.editing = true;
// 		$http.post('/post/editTag', action).success(function() {
// 		}).error();
// 	}
// 	$scope.deleteAction = function(post) {
// 		$scope.post = post;
// 		$http.post('/post/deleteAction', $scope.post).success(function(data) {
// 		}).error();
// 	}
// 	// Guarda la foto
//
// 	$scope.reportAction = function (post) {
// 		$scope.post = post;
// 		$http.post('/post/reportAction', $scope.post).success(function(data) {
// 		}).error();
// 	}
// 	// Envía un objeto con los datos del usuario que se desea bloquear o desbloquear mediante un post
// 	//
// 	$scope.blockUser = function(userToBlock) {
// 		$scope.user.userToBlock = userToBlock;
// 		if (!$scope.user.userToBlock.block) {
// 			$scope.user.userToBlock.block = true;
// 			$http.post('/user/block', $scope.user).success(function(data) {
// 			}).error();
// 		} else {
// 			$scope.user.userToBlock.block = false;
// 			$http.post('/user/unBlock', $scope.user).success(function(data) {
// 			}).error();
// 		}
// 	}
// 	// Post
// 	// 
// 	$scope.newAction = {};
// 	$scope.shareActionOnFb = function(post) {
// 		$scope.post = post.media;
// 		$http.post('/post/shareActionOnFb', $scope.post).success(function(data) {
// 		}).error();
// 	}
// 	$scope.changeLanguage = function(language) {
// 		$scope.user.language = language;
// 		$http.post('/user/change-language', $scope.user).success(function(data) {
// 		}).error();
// 	}
// $scope.sendNewAction = function() {// TODO: Evaluar riesgo de ataque, Crear post para form Multi - Riesgo de ataque
// 	var createForm = new FormData();
// 	for (key in $scope.newAction) {
// 		createForm.append(key, $scope.newAction[key]);
// 	}
// 	$http.post('/post', createForm, {
// 		withCredentials: true,
// 		headers: {'Content-Type': undefined },
// 		transformRequest: angular.identity
// 	}).success(function(data) {
// 	}).error();
// }
// 	// Geo
// 	//
function getGeo(next, error) {
	var coords = {};
	if (navigator.geolocation) {
		var position = 0;		
		navigator.geolocation.getCurrentPosition(function(position) {
			coords.accuracy = position.coords.accuracy;
			coords.altitude = position.coords.altitude;
			coords.altitudeAccuracy = position.coords.altitudeAccuracy;
			coords.heading = position.coords.heading;
			coords.latitude = position.coords.latitude;
			coords.longitude = position.coords.longitude;
			coords.speed = position.coords.speed;
			//$scope.user.data.coords = coords;
			//$scope.newAction.coords = coords;
			console.log(coords);
			next(coords); 
		}, function(errorObj) {
			var errorMsg = "";
			switch(errorObj.code) {
				case errorObj.PERMISSION_DENIED:
					errorMsg = "User denied the request for Geolocation."
					break;
				case errorObj.POSITION_UNAVAILABLE:
					errorMsg = "Location information is unavailable."
					break;
				case errorObj.TIMEOUT:
					errorMsg = "The request to get user location timed out."
					break;
				case errorObj.UNKNOWN_ERROR:
					errorMsg = "An unknown error occurred."
					break;
			}
			// TODO: Manejar error
			// TODO: si el usuario niega su ubicación se tendría que obtener las coordenadas de acuerdo a su dirección ip
			console.log(errorMsg);
			coords.latitude = "-16.3988900";
			coords.longitude = "-71.5350000";
			next(coords);
			//error(errorMsg);
		}, {maximumAge:600000, timeout:10000, enableHighAccuracy: true});
	} else {
		error("Geolocation is not supported by this browser.");
	}
}

// .filter('capitalize', function() {
// 	return function(input) {
// 		return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
// 	}
// })

// /*if(window.innerHeight > window.innerWidth){
//     document.getElementsByTagName("body").style.transform = "rotate(90deg)";
// }*/

window.onpopstate = function(event) {
	app.updateState(event.state);
};