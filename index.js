const whatsapp = require('velixs-md')                                                         
const prefix = '.'
let listmenu = ['terkoneksikerouter','dev <endpoint>']

whatsapp.startSession('reyzee')

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

whatsapp.onConnected(async (session) => {
	console.log("session connected : " + session)
})

whatsapp.onMessageReceived(async(msg)=>{
	//function
	const loading = async() => {
		await whatsapp.sendTextMessage({
			sessionId: msg.sessionId,
			to: msg.key.remoteJid,
			text: '[ _*LOADING*_ ]',
			answering: msg,
			isGroup : whatsapp.isGroup(msg.key.remoteJid)
		})
	}
	const apiMikrotik = async(endpoint,method = 'GET',data) => {
		const url = 'https://cc4f0d0a674f.sn.mynetname.net/rest/'
		switch(method) {
			case 'PUT':
			case 'PATCH':
			case 'POST':
				result = await fetch(`${url}${endpoint}`, {
					method: method,
					body: JSON.stringify(data),
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Basic ${btoa('api-botwa:api-botwa')}`,
					}
				})
				break
			default:
				result = await fetch(`${url}${endpoint}`, {
					method: method,
					headers: {
						'Authorization': `Basic ${btoa('api-botwa:api-botwa')}`,
					}
				})
		}
		return result.json()
	}

	//menu
	if(msg.message?.extendedTextMessage?.text == `${prefix}menu` || msg.message?.conversation == `${prefix}menu`) {
		console.log('\n.menu\n')
		let response = '\t[ _*MENU*_ ]\n'
		listmenu.forEach(menu => {
			response += `\n${prefix}${menu}`
		})
		await whatsapp.sendTextMessage({
			sessionId: msg.sessionId,
			to: msg.key.remoteJid,
			text: response,
			answering: msg,
			isGroup : whatsapp.isGroup(msg.key.remoteJid)
		})
		console.log(response)
	}

	// terkoneksi ke router
	if(msg.message?.extendedTextMessage?.text == `${prefix}terkoneksikerouter` || msg.message?.conversation == `${prefix}terkoneksikerouter`) {
		console.log('.terkoneksikerouter')
		loading()
		let arp = await apiMikrotik('ip/arp')
		let num = ''
		for(let i=0;i<arp.length;i++){
			num += (i<arp.length-1)?`${i},`:`${i}`
		}
		const updateArp = await apiMikrotik('ip/arp/remove','POST',{numbers: num})
		await whatsapp.sendTyping({
			sessionId: msg.sessionId,
			to: msg.key.remoteJid,
			duration: 1500,
			isGroup : whatsapp.isGroup(msg.key.remoteJid)
		});
		arp = await apiMikrotik('ip/arp')
		const dhcp = await apiMikrotik('ip/dhcp-server/lease')
		let response = '\t[ _*TERKONEKSI KE ROUTER*_ ]\n' 
		arp.forEach(ip => {
			dhcp.forEach(cp => {
				if(ip['address'] == cp['address']){
					response += `\n• ${cp['host-name']} - _${cp['address']}_`
				}
			})
		})
		await whatsapp.sendTextMessage({
			sessionId: msg.sessionId,
			to: msg.key.remoteJid,
			text: response,
			answering: msg,
			isGroup : whatsapp.isGroup(msg.key.remoteJid)
		})
		console.log(response)
	}

	//developer command
	if(msg.message?.conversation.startsWith(`${prefix}dev `)){
		console.log('.dev')
		loading()
		let text = msg.message?.conversation.slice(5)
		let endpoint = text.replaceAll(' ','/')
		
		fetch(`https://cc4f0d0a674f.sn.mynetname.net/rest/${endpoint}`, {
			headers: {
				'Authorization': `Basic ${btoa('api-botwa:api-botwa')}`,
			},
		}).then(response => response.text())
			.then(async(data) => {
				await whatsapp.sendTextMessage({
					sessionId: msg.sessionId,
					to: msg.key.remoteJid,
					text: data,
					answering: msg,
					isGroup : whatsapp.isGroup(msg.key.remoteJid)
				})
			})	
	}
})