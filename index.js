//AQUI ESTOU IMPORTANDO LIBS E INSTANCIANDO ELAS PARA 
const { Socket } = require("dgram");
var express = require("express")
var app = express()

var http = require("http").createServer(app) // servidor nativo do Nodejs
var io = require("socket.io")(http);

var database = require("./database") //Importando nossa conexão com o banco de dados para podermos manipular, lembrando que estou usando o knex para fazer a manipulação

app.use(express.static('public')) //Entregar arquivos estaticos // Permiti usar frameworks de estilização
app.set("view engine", "ejs"); // Transportar dados do back para o front, conseguimos renderizar o html no back

app.use(express.urlencoded({ extended : false }));
app.use(express.json())

const bodyParser = require("body-parser") // usado para transportar dados tanto do front para o back quanto do back para o front
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

let mensagens = [] // Array usado para guardar as mensagens. Observação: as mensagens ficarão guardadas até que o servidor seja reiniciado. Lembrando tambem que tem a opção de usar uma base de dados para salvar as mensagens permanentementes.

io.on("connection", (socket) => { // instancia com cliente que acabou de se conectar //
    console.log("Cliente conectado: " + socket.id) // Identificando toda vez que um usuario nova se conecta

    socket.on("disconnect", ()=> {
        console.log("X desconectou: " + socket.id) // Identificando toda vez que um usuario se desconecta
    })

    socket.on('enviarMensagem', data => { // Aqui estou recebendo um evento do front que se chama 'enviarMensagem' junto aos dados(mensagem) enviados
        mensagens.push(data) // Aqui estou dando push no array com os dados(mensagem) que recebi do front
        io.emit('conteudoMensagens', data) // Aqui estou emitindo um evento para o front com os dados(mensagem) que recebi no evento 'enviarMensagem'
    })
    
    socket.emit('mensagensAnteriores', mensagens) // Aqui estou emitindo um evento para o front que se chama 'mensagensAnterios' junto ao array 'mensagens' com todas as mensagens que foram enviadas do fronto


    socket.on("cadastro",(data) => { //Recebendo um evento 'Cadastro'
        var nome = data.Nome // Criando uma variavel nome e setando o valor do front nela
        var email = data.Email // Criando uma variavel nome e setando o valor do front nela
        var senha = data.Senha // Criando uma variavel nome e setando o valor do front nela
        var dados = [ // criando um array de objs com os dados do usuario
            {
                Nome:nome,
                Email:email,
                Senha:senha
            }
        ]
        if(nome == undefined || nome == '' || nome == ' '){ // Validação com objetivo de verificar se o nome não existe, está vindo como string vazia, ou apenas como string com espaço
            var titleerro = "Nome vazio"
            var msg = "Por favor, informe o nome"
            socket.emit("vazio", msg, titleerro) // Caso caia nesse if um evento será emitido para o front com a mensagem de informação

        }else if(email == undefined || email == '' || email == ' '){ // Validação com objetivo de verificar se o email não existe, está vindo como string vazia, ou apenas como string com espaço
            var titleerro = "E-mail vazio"
            var msg = "Por favor, informe o email"
            socket.emit("vazio", msg, titleerro) // Caso caia nesse if um evento será emitido para o front com a mensagem de informação

        }else if(senha == undefined || senha == '' || senha == ' '){ // Validação com objetivo de verificar se a senha não existe, está vindo como string vazia, ou apenas como string com espaço
            var titleerro = "Senha vazia"
            var msg = "Por favor, informe a senha"
            socket.emit("vazio", msg, titleerro) // Caso caia nesse if um evento será emitido para o front com a mensagem de informação

        }else{ //Caso o nome, email e a senha existam irá cair no else
            database.select('*').where({Email:email}).table('usuario').then(data => { // Aqui está sendo feita uma consulta no banco de dados com uma condição, retornar apenas o registro que tenha o email igual ao email passado pelo usuario na hora do cadastro
                var CodUser = data[0].CodUser //Acessando o Codigo do usuario e setando o valor na  variavel CodUser
                if(CodUser > 0){ // Verificando se o retorno o valor da variavel é maior do que zero, o que significa que já existe um registro com esse email passado
                    var titleerro = "Erro ao tentar cadastrar"
                    var msg = "Este usuario já existe, por favor, informe outro email"
                    socket.emit("vazio", msg, titleerro) // Caso caia nesse if um evento será emitido para o front com a mensagem de informação()
                }
            }).catch(err => {// Caso não existe o registro com o email = ao email passado pelo usuario
                console.log(err) // iremos exibir o erro
                database.insert(dados).into('usuario').then(data => { // Como não existe o email na base de dados, iremos dar insert e criar um novo usuario
                    console.log(data)
                    var ok = 1
                    console.log(ok)
                    socket.emit('redirect', ok ) // Emitindo um evento para manipulr no front
                }).catch(err => { // Caso o cadastro não dê certo 
                    console.log(err) // Iremos exibir o erro
                })
            })
        }
    }) 


    socket.on("logar",(data) => { // Aqui estou recebendo um evento do front que se chama 'logar' junto aos dados enviados(email e senha)
        var email = data.email  // Criando uma variavel email e setando nela o valor do email
        var senha = data.senha  // Criando uma variavel senha e setando nela o valor da senha

        var msgEmail = "Por favor, informe o email" // Criando uma variavel para setar nela uma mensagem para alertar ao usuario de que o campo está vazio
        var msgSenha = "Por favor informe a senha" // Criando uma variavel para setar nela uma mensagem

        if(email == undefined || email == '' || email == ' '){ // Validação com objetivo de verificar se o email não existe, está vindo como string vazia, ou apenas como string com espaço
            socket.emit("emailVazio", msgEmail) // Caso caia nesse if um evento será emitido para o front com a mensagem de informação

        }else if(senha == undefined || senha == '' || senha == ' '){ // Validação com objetivo de verificar se a senha não existe, está vindo como string vazia, ou apenas como string com espaço
            socket.emit("senhaVazia", msgSenha) // Caso caia nesse else if um evento será emitid para o front com a mensagem de informação

        }else{ //Caso o email e a senha existam irá cair no else
            database.select(['CodUser', 'Nome']).where({Email:email}).where({Senha:senha}).table('usuario').then(user => { // Aqui está sendo feita uma consulta no banco de dados com 2 condições, filtrar apenas  o CodUser e o Nome do usuario ,caso o email e senha batem com os da base de dados
                if(user.length > 0){ //Como é uma promisse aqui dentro do then estou verificando se os dados retornados é > 0 
                    var nomeUser = user[0].Nome //Criei uma variavel e estou acessando o nome do indice [0] do retorno da consulta e setando esse valor na variavel
                    var CodUser = user[0].CodUser //Criei uma variavel e estou acessando o nome do indice [0] do retorno da consulta e setando esse valor na variavel
                    var destino = "http://localhost:3000/" //Criei uma variavel com um endereço http
                    socket.emit("dadosUser", nomeUser, CodUser, destino) //Aqui estou emitindo um evento que se chama 'dadosUser' junto com as 3 variaveis e seus valores

                }else{ //Caso os dados retornados da consulta não seja > 0 irá cair nesse else
                    var msg = "Usuario não existe" // Criei uma variavel e atribui um valor(uma mensagem) a ela
                    socket.emit("erroLogin", msg) // Emitindo um evento que se chama 'erroLogin' e a msg
                }
            }).catch(err => {//Como é uma promisse, caso a consulta não exista irá executar esse bloco abaixo .catch(err) que faz exatamente a mesma coisa que o bloco acima(else)
                console.log(err)
                var msg = "Usuario não existe"
                socket.emit("erroLogin", msg)
            })
        }
    })



})

//ROTEAMENTO DAS ROTAS
app.get("/", (req, res) => { // http://localhost:3000/
    database.select(['Nome']).table('usuario').then(users => { // Consultando todos os usuarios existentes na base de dados
        res.render("index",{users:users}) // Renderizando a pagina passando para ela todos os dados de todos os usuarios
    }).catch(err => {
        console.log(err)
    })
})

app.get("/login", (req, res) => {
    res.render("usuario/login")
})

http.listen(3000, () => { // Criando um servidor na porta 3000 
    console.log("APP RODANDO")
})