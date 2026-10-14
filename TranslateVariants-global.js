// <nowiki>
/* globals TranslateVariants:true */
/**
 * 使用說明請見 https://zh.wikipedia.org/wiki/User:Xiplus/js/TranslateVariants
 */
function implWrapper( ...args ) {
	if ( typeof mw.loader.impl === 'function' ) {
		return mw.loader.impl( function () {
			return args;
		} );
	}

	return mw.loader.implement.apply( mw.loader, args );
}
async function loadHanAssist() {
	const moduleName = 'userscript.TranslateVariants.HanAssist';

	if ( mw.loader.getState( 'ext.gadget.HanAssist' ) ) {
		mw.loader.register( moduleName, null, [ 'ext.gadget.HanAssist' ] );

		await mw.loader.using( 'ext.gadget.HanAssist' );

		implWrapper(
			moduleName + '@',
			{
				main: 'index.js',
				files: {
					'index.js': ( require, module ) => {
						module.exports = require( 'ext.gadget.HanAssist' );
					}
				}
			}
		);

		if ( mw.loader.getState( moduleName ) === 'missing' ) {
			mw.loader.state( { [ moduleName ]: 'loaded' } );
		}
	} else {
		mw.loader.register( moduleName, null, [] );

		implWrapper(
			moduleName + '@',
			[ 'https://meta.wikimedia.org/w/index.php?title=User:SunAfterRain/js/HanAssist.js&action=raw&ctype=text/javascript' ]
		);

		await mw.loader.using( moduleName );
	}

	const require = await mw.loader.using( moduleName );

	return require( moduleName );
}
( async () => {
	await mw.loader.using(['mediawiki.api', 'mediawiki.util', 'mediawiki.ForeignApi', 'oojs-ui-core', 'oojs-ui-windows', 'mediawiki.diff.styles']);
	const { conv } = await loadHanAssist();

	if ( !mw.config.get( 'wgPageName' ).match( /^MediaWiki:[^/]+(\/zh)?$/ ) ) {
		return;
	}

	const addTranslateVariantsLink = () => {
		const link = mw.util.addPortletLink(
			'p-cactions',
			'#',
			conv( { hans: '转换变体', hant: '轉換變體' } )
		);
		$( link ).on( 'click', function () {
			$( this ).remove();
			main();
		} );
		return link;
	};
	mw.hook( 'wikipage.content' ).add( addTranslateVariantsLink );

	if (typeof (TranslateVariants) == 'undefined') {
		TranslateVariants = {};
	}
	if (typeof (TranslateVariants.summary) != 'string') {
		TranslateVariants.summary = conv( { hans: '自动转换变体自', hant: '自動轉換變體自' } ) + '[[$1]] via [[w:User:Dabao_qian/TranslateVariants-global.js|TranslateVariants]]';
	}

	const langs = ['zh', 'zh-hans', 'zh-hant', 'zh-hk'];
	const langname = {
		'zh': conv( { hans: '主页面', hant: '主頁面' } ),
		'zh-hans': '简体',
		'zh-hant': '繁體',
		'zh-hk': '香港繁體',
	};
	const defaultChecked = {
		'zh': false,
		'zh-hans': true,
		'zh-hant': true,
		'zh-hk': false,
	};

	class VariantDialog extends OO.ui.ProcessDialog {
		constructor( canDelete ) {
			super();
			this.canDelete = canDelete;
		}
		initialize() {
			super.initialize();
			this.checkboxes = {};
			this.panel = new OO.ui.PanelLayout( { padded: true, expanded: false } );
			const fieldset = new OO.ui.FieldsetLayout( { label: conv( { hans: '选择要转换的变体', hant: '選擇要轉換的變體' } ) } );
			const createCheckbox = ( lang ) => {
				const checkbox = new OO.ui.CheckboxInputWidget( { selected: defaultChecked[lang] } );
				this.checkboxes[lang] = checkbox;
				checkbox.on( 'change', () => {
					this.updateActionAbilities();
				} );
				return new OO.ui.FieldLayout( checkbox, { label: langname[lang], align: 'inline' } );
			};

			const checkboxLayout = new OO.ui.HorizontalLayout( {
				items: langs.map( createCheckbox ),
			} );

			checkboxLayout.$element.css( { justifyContent: 'space-between' } );
			fieldset.addItems( [checkboxLayout] );
			if ( this.canDelete ) {
				this.deleteCheckbox = new OO.ui.CheckboxInputWidget( { selected: false } );
				fieldset.addItems( [ 
					new OO.ui.FieldLayout( this.deleteCheckbox, { label: conv( { hans: '转换完成后自动删除已弃用变体子页面', hant: '轉換完成後自動刪除已棄用變體子頁面' } ), align: 'inline' } )
				] );
			}
			const notice = $( '<div>' )
				.css( {
					color: 'var(--color-placeholder, #72777d)',
					fontSize: '0.875em',
					marginTop: '0.5em',
					lineHeight: '1.5em'
				} );
			$( '<b>' )
				.text( '提醒：' )
				.appendTo( notice );
			notice.append(
				conv( {
					hans: 'TranslateVariants工具使用IT、MediaWiki及specialpages三个转换组进行自动转换，请确认转换结果是否正确！',
					hant: 'TranslateVariants工具使用IT、MediaWiki及specialpages三個轉換組進行自動轉換，請確認轉換結果是否正確！'
				} )
			);
			$( '<div>' )
				.text( conv( {
					hans: '自MediaWiki 1.41起，修改系统消息最多只需分别维护简体、繁体、香港繁体子页面，故本工具不再提供其他变体选项，如已存在其他变体子页面建议在更新后删除，已存在的主页面因历史原因需要保留。',
					hant: '自MediaWiki 1.41起，修改系統消息最多只需分別維護簡體、繁體、香港繁體子頁面，故本工具不再提供其他變體選項，如已存在其他變體子頁面建議在更新後刪除，已存在的主頁面因歷史原因需要保留。'
				} ) )
				.css( { marginTop: '0.5em' } )
				.appendTo( notice );
			fieldset.$element.append( notice );
			this.panel.$element.append( fieldset.$element );
			this.$body.append( this.panel.$element );
		}

		updateActionAbilities() {
			const hasSelection = langs.some( ( lang ) => this.checkboxes[lang].isSelected() );
			this.actions.setAbilities( {
				done: hasSelection
			} );
		}

		getSetupProcess( data ) {
			return super.getSetupProcess( data ).next( () => {
				this.updateActionAbilities();
			} );
		}

		getReadyProcess( data ) {
			return super.getReadyProcess( data ).next( () => {
				const doneAction = this.getActions().get( { actions: 'done' } )[ 0 ];
				if ( doneAction && !doneAction.isDisabled() ) {
					doneAction.focus();
				}
			} );
		}

		confirmSelection() {
			const selected = langs.filter( ( lang ) => this.checkboxes[lang].isSelected() );
			this.close( {
				action: 'done',
				selected: selected,
				deleteDeprecated: this.deleteCheckbox ? this.deleteCheckbox.isSelected() : false
			} );
		}

		getActionProcess( action ) {
			if ( action === 'done' ) {
				return new OO.ui.Process( () => {
					this.confirmSelection();
				} );
			}
			if ( action === 'cancel' ) {
				return new OO.ui.Process( () => {
					this.close( {
						action: 'cancel'
					} );
				} );
			}
			return super.getActionProcess( action );
		}
	}

	VariantDialog.static.name = 'TranslateVariantsDialog';
	VariantDialog.static.title = conv( { hans: '转换变体', hant: '轉換變體' } );
	VariantDialog.static.size = 'medium';
	VariantDialog.static.actions = [
		{ action: 'cancel', label: conv( { hans: '取消', hant: '取消' } ), flags: 'safe' },
		{ action: 'done', label: conv( { hans: '确定', hant: '確定' } ), flags: [ 'primary', 'progressive' ] }
	];

	function askLanguages( canDelete ) {
		return new Promise( ( resolve ) => {
			const windowManager = new OO.ui.WindowManager( { modal: true } );
			$( document.body ).append( windowManager.$element );
			const dialog = new VariantDialog( canDelete );
			windowManager.addWindows( [ dialog ] );
			const lifecycle = windowManager.openWindow( dialog );
			lifecycle.closed.then(
				( data ) => {
					resolve( data && Array.isArray( data.selected ) ? data : null );
					windowManager.$element.remove();
				},
				() => {
					resolve( null );
					windowManager.$element.remove();
				}
			);
		} );
	}

	async function main() {
		let result = {};
		const publishTasks = [];
		const notificationPromises = [];

		function removePublishTask( task ) {
			const index = publishTasks.indexOf( task );
			if ( index !== -1 ) {
				publishTasks.splice( index, 1 );
			}
		}

		function notify( message, options = {} ) {
			const classes = Array.isArray( options.classes ) ?
				[ ...options.classes, 'TranslateVariants-notification' ] :
				options.classes ?
					[ options.classes, 'TranslateVariants-notification' ] :
					[ 'TranslateVariants-notification' ];

			const promise = mw.notify(
				message,
				$.extend( {}, options, {
					classes: classes
				} )
			);

			notificationPromises.push( promise );
			return promise;
		}

		const api = new mw.Api({ userAgent: 'Gadget-TranslateVariants' });
		const currentTitle = mw.config.get( 'wgPageName' );
		const isZhSubpage = currentTitle.endsWith( '/zh' );
		if ( isZhSubpage ) {
			const basename = currentTitle.replace( /\/zh$/, '' );
			const data = await api.get( {
				action: 'query',
				titles: [ basename ],
				formatversion: '2'
			} );
			const page = data.query.pages[0];
			defaultChecked.zh = !page.missing;
		}

		let canDelete;
		try {
			const userInfo = await api.getUserInfo();
			canDelete = Array.isArray( userInfo.rights ) && userInfo.rights.includes( 'delete' );
		} catch {
			canDelete = false;
		}
		const zhwpapi = mw.config.get( 'wgDBname' ) === 'zhwiki'
			? new mw.Api( {
				userAgent: 'Gadget-TranslateVariants'
			} )
			: new mw.ForeignApi(
				'//zh.wikipedia.org/w/api.php',
				{
					userAgent: 'Gadget-TranslateVariants'
				}
			);
		let basepagetext = '';
		const table = $('<div id="TranslateVariants">').prependTo('#bodyContent');

		const submitall = new OO.ui.ButtonWidget( {
			label: conv( { hans: '发布所有更改', hant: '發布所有變更', hk: '發佈所有變更' } ),
			flags: [ 'primary', 'progressive' ]
		} );
		submitall.setDisabled( true );

		submitall.on( 'click', function() {
			submitall.setDisabled( true );
			if ( publishTasks.length === 0 ) {
				notify( conv( { hans: '没有任何更改可发布', hant: '沒有任何變更可發布', hk: '沒有任何變更可發佈' } ), { type: 'error' } );
				( async () => {
					await deleteDeprecatedVariants();
					await waitForNotifications();
					location.reload();
				} )();
				return;
			}

			OO.ui.confirm(
				conv( { hans: '发布 ', hant: '發布 ', hk: '發佈 ' } ) + publishTasks.length + conv( { hans: ' 个更改？', hant: ' 個變更？' } )
			).then( ( confirmed ) => {
				if ( !confirmed ) {
					notify(conv( { hans: '已取消发布', hant: '已取消發布', hk: '已取消發佈' } ), { type: 'warn' });
					submitall.setDisabled( false );
					return;
				}
				( async () => {
					for ( const task of [ ...publishTasks ] ) {
						const success = await task();
						if ( !success ) {
							notify( conv( { hans: '发布失败，请再试一次', hant: '發布失敗，請再試一次', hk: '發佈失敗，請再試一次' } ), { type: 'error' } );
							submitall.setDisabled( false );
							return;
						}
					}
					await deleteDeprecatedVariants();
					await waitForNotifications();
					location.reload();
				} )();
			} );
		} );
		table.append(
			$( '<div>' )
				.css( {
					'text-align': 'right',
					'margin-bottom': '0.5em'
				} )
				.append( submitall.$element )
		);

		let text;
		const $textbox = $('#wpTextbox1');
		if ($textbox.length === 1) {
			text = $textbox.val();
		} else {
			let data = await api.get({
				action: 'query',
				prop: 'revisions',
				rvprop: ['content', 'timestamp'],
				titles: [mw.config.get('wgPageName')],
				formatversion: '2',
				curtimestamp: true,
			});
			if (!data.query || !data.query.pages) {
				OO.ui.alert('unknown error');
				return;
			}
			let page = data.query.pages[0];
			if (!page || page.invalid) {
				OO.ui.alert('invalidtitle');
				return;
			}
			if (page.missing) {
				OO.ui.alert('nocreate-missing');
				return;
			}
			const revision = page.revisions[0];
			text = revision.content;
		}
		result.zh = text;

		text = text.replace(/[[\]{}<>|:*'_#&\s]/gim, function(s) {
			return "&#" + s.charCodeAt(0) + ";";
		});
		text = text.replace(/(&#91;&#91;)((?:(?!&#124;)(?!&#93;).)+?)(&#124;(?:(?!&#93;).)+?&#93;&#93;)/g, '$1-{$2}-$3');
		text = text.replace(/-&#123;(.*?)&#125;-/g, function(s) {
			return s
				.replace('-&#123;', '-{')
				.replace('&#125;-', '}-')
				.replace(/&#124;/g, '|')
				.replace(/&#32;/g, ' ')
				.replace(/&#61;/g, '=')
				.replace(/&#62;/g, '>')
				.replace(/&#58;/g, ':');
		});
		basepagetext = text;

		const selection = await askLanguages( canDelete );
		const selected = selection ? selection.selected : null;
		if (!selected || selected.length === 0) {
			$( '#TranslateVariants' ).remove();
			addTranslateVariantsLink();
			notify(conv( { hans: '已取消，未进行任何转换', hant: '已取消，未進行任何轉換' } ), { type: 'warn' });
			return;
		}
		const deleteDeprecated = canDelete && selection.deleteDeprecated;
		let langqueue = selected.filter(function(lang) {
			return langs.indexOf(lang) !== -1;
		});

		async function deleteDeprecatedVariants() {
			if ( !deleteDeprecated ) {
				return;
			}

			const deprecatedLangs = [
				'zh-cn',
				'zh-mo',
				'zh-my',
				'zh-sg',
				'zh-tw'
			];

			if ( !selected.includes( 'zh-hk' ) ) {
				deprecatedLangs.push( 'zh-hk' );
			}

			const basename = mw.config.get( 'wgPageName' ).replace( /\/zh$/, '' );
			const titles = deprecatedLangs.map( ( lang ) => basename + '/' + lang );

			let data;

			try {
				data = await api.get( {
					action: 'query',
					titles: titles,
					formatversion: '2'
				} );
			} catch ( e ) {
				notify( conv( { hans: '检查已弃用变体子页面是否存在时发生错误：', hant: '檢查已棄用變體子頁面是否存在時發生錯誤：' } ) + e, { type: 'error' } );
				return;
			}

			const existingTitles = data.query.pages
				.filter( ( page ) => !page.missing )
				.map( ( page ) => page.title );

			for ( const title of existingTitles ) {
				try {
					await api.postWithToken( 'csrf', {
						action: 'delete',
						title: title,
						reason: '[[Wikipedia:CSD#G8|G8]]: ' + conv( { hans: '技术原因', hant: '技術原因' } )
					} );

					notify( conv( { hans: '已删除 ', hant: '已刪除 ' } ) + title );
				} catch ( e ) {
					notify( conv( { hans: '删除 ', hant: '刪除 ' } ) + title + conv( { hans: ' 时发生错误：', hant: ' 時發生錯誤：' } ) + e, { type: 'error' } );
				}
			}
		}

		async function waitForNotifications() {
			await Promise.all( notificationPromises );
			await new Promise( ( resolve ) => {
				requestAnimationFrame( resolve );
			} );

			const selector = '.mw-notification.TranslateVariants-notification';

			await new Promise( ( resolve ) => {
				const check = () => {
					if ( !$( selector ).length ) {
						resolve();
						return;
					}

					requestAnimationFrame( check );
				};

				check();
			} );
		}

		process();

		function process() {
			if (langqueue.length === 0) {
				submitall.setDisabled( false );
				return;
			}

			const lang = langqueue.shift();
			const diffTable = $('<div id="TranslateVariants-diff-' + lang + '">').appendTo(table);
			$('<hr>').appendTo(table);

			const basename = mw.config.get('wgPageName').replace(/\/zh$/, '');
			let targetTitle;
			if (lang == 'zh') {
				targetTitle = basename + '';
			} else {
				targetTitle = basename + '/' + lang;
			}

			const contentlang = {
				'zh': 'zh-cn',
				'zh-hans': 'zh-cn',
				'zh-hant': 'zh-tw',
				'zh-hk': 'zh-hk',
			}[ lang ];
			let newtext;

			zhwpapi.parse(
				'{{NoteTA|G1=IT|G2=MediaWiki|G3=specialpages}}<div id="TVcontent">' + basepagetext + '</div>',
				{
					'uselang': contentlang,
					'prop': 'text',
				}
			).then(function(data) {
				newtext = $('<div/>').html(data).find('#TVcontent').text();

				return api.post({
					action: 'query',
					prop: 'revisions',
					titles: [targetTitle],
					rvdifftotext: newtext,
					formatversion: '2',
				});
			}, function(err) {
				notify('解析' + lang + conv( { hans: '时发生错误：', hant: '時發生錯誤：' } ) + err, { type: 'error' });
			}).then(function(data) {
				let tool = $('<div><a href="' + mw.util.getUrl(targetTitle) + '">' + lang + '（' + langname[lang] + '）</a>（<a href="' + mw.util.getUrl(targetTitle, { action: 'edit' }) + '">' + conv( { hans: '编', hant: '編' } ) + '</a>）</div>').appendTo(diffTable);
				let page = data.query.pages[0];
				if (page.missing) {
					const submit = new OO.ui.ButtonWidget( {
						label: conv( { hans: '发布页面', hant: '發布頁面', hk: '發佈頁面' } ),
						flags: [ 'progressive' ]
					} );
					submit.$element.css( { float: 'right' } );
					tool.append( submit.$element );
					const save = function() {
						submit.setDisabled( true );
						return api.create(
							targetTitle,
							{ summary: TranslateVariants.summary.replace( /\$1/g, mw.config.get( 'wgPageName' ) ) },
							newtext
						).then(
							function() {
								notify( conv( { hans: '已编辑 ', hant: '已編輯 ' } ) + targetTitle );
								removePublishTask( save );
								submit.$element.remove();
								return true;
							},
							function( e ) {
								submit.setDisabled( false );
								notify( conv( { hans: '编辑 ', hant: '編輯 ' } ) + targetTitle + conv( { hans: ' 发生错误：', hant: ' 發生錯誤：' } ) + e, { type: 'error' } );
								return false;
							}
						);
					};
					submit.on( 'click', save );
					publishTasks.push( save );
					$('<pre>').html(newtext.replace(/[<>&]/gim, function(s) {
						return "&#" + s.charCodeAt(0) + ";";
					})).appendTo(diffTable);
					return;
				}
				let diff = page.revisions[0].diff.body;
				if (diff == '') {
					$('<span style="float: right;">' + conv( { hans: '无更改', hant: '無變更' } ) + '</span>').appendTo(tool);
				} else {
					const submit = new OO.ui.ButtonWidget( {
						label: conv( { hans: '发布更改', hant: '發布變更', hk: '發佈變更' } ),
						flags: [ 'progressive' ]
					} );
					submit.$element.css( { float: 'right' } );
					tool.append( submit.$element );
					const save = function() {
						submit.setDisabled( true );
						return api.edit(
							targetTitle,
							function() {
								return {
									text: newtext,
									summary: TranslateVariants.summary.replace( /\$1/g, mw.config.get( 'wgPageName' ) ),
									nocreate: false
								};
							}
						).then(
							function() {
								notify( conv( { hans: '已编辑 ', hant: '已編輯 ' } ) + targetTitle );
								removePublishTask( save );
								submit.$element.remove();
								return true;
							},
							function( e ) {
								submit.setDisabled( false );
								notify( conv( { hans: '编辑 ', hant: '編輯 ' } ) + targetTitle + conv( { hans: ' 发生错误：', hant: ' 發生錯誤：' } ) + e, { type: 'error' } );
								return false;
							}
						);
					};
					submit.on( 'click', save );
					publishTasks.push( save );
					$('<table class="diff">').html(diff).prepend('<colgroup><col class="diff-marker"><col class="diff-content"><col class="diff-marker"><col class="diff-content"></colgroup>').appendTo(diffTable);
				}
			}, function(err) {
				notify(conv( { hans: '获取', hant: '取得' } ) + lang + conv( { hans: '差异时发生错误：', hant: '差異時發生錯誤：' } ) + err, { type: 'error' });
			}).always(function() {
				process();
			});
		}
	}
} )();
// </nowiki>
