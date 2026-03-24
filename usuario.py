from app import app, db, Usuario
from werkzeug.security import generate_password_hash

def criar_usuario(username, senha, tipo):
    with app.app_context():

        existe = Usuario.query.filter_by(username=username).first()
        if existe:
            print(f"Usuário '{username}' já existe.")
            return

        novo = Usuario(
            username=username,
            password_hash=generate_password_hash(senha),
            tipo=tipo
        )

        db.session.add(novo)
        db.session.commit()

        print(f"Usuário '{username}' criado com sucesso!")

if __name__ == "__main__":
    criar_usuario("Bruna Emilly Viana Siqueira", "07663696174", "admin")
    criar_usuario("Patricia Pereira de Oliveira", "07626243102", "admin")
    criar_usuario("Mateus Santo Silva ", "05405469173", "admin")
    criar_usuario("Gabriellen Vitoria Nunes de Sousa", "03774249199", "admin")

    # criar_usuario("Vania", "Etc2026_", "usuario")