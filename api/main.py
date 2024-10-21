from fastapi import FastAPI
from ensta import Web
from pydantic import BaseModel

class UpdateProps(BaseModel):
    name: str
    author: str
    username: str
    password: str

app = FastAPI()


@app.get("/")
def test():
    return { "Hello": "world"}


@app.post("/update_bio")
def update_bio(info: UpdateProps):
    print(info)
    web = Web(info.username, info.password)

    web.change_bio('Now listening to: ' + info.name + ' by ' + info.author)
    return { "success": "Success"}