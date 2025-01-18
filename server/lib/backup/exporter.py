import json
import os
import uuid
from zipfile import ZipFile

from sqlmodel import Session, select

import configure
from api.image import get_image_and_file_path_or_404
from database.sql_model import Room, Bot, Persona, Prompt, Conversation, Summary


class DataExporter:
    def __init__(self, session: Session, username: str):
        os.makedirs(configure.get_store_path(f'{username}/export'), exist_ok=True)
        self.uuid = uuid.uuid4().hex
        self.file = ZipFile(configure.get_store_path(f"{username}/export/{self.uuid}.zip"), "w")
        self.dirs = {}
        self.exported_rooms = {}
        self.exported_bots = {}
        self.exported_prompts = {}
        self.exported_personas = {}
        self.exported_images = {}
        self.exported_conversations = {}
        self.exported_summaries = {}

        self.session = session
        self.username = username

    def finish(self):
        self.file.writestr("meta.json", json.dumps({
            "rooms": list(self.exported_rooms.keys()),
            "bots": list(self.exported_bots.keys()),
            "personas": list(self.exported_personas.keys()),
            "prompts": list(self.exported_prompts.keys()),
            "images": list(self.exported_images.keys()),
            "conversations": list(self.exported_conversations.keys()),
            "summaries": list(self.exported_summaries.keys()),
        }))

        self.file.close()

    def mkdir_exists_ok(self, name):
        if name in self.dirs:
            return
        self.dirs[name] = True
        self.file.mkdir(name)

    def export_room(self, room: Room):
        if room.id in self.exported_rooms:
            return

        self.mkdir_exists_ok('rooms')
        self.file.writestr(f"rooms/{room.id}.json", room.model_dump_json())
        self.exported_rooms[room.id] = True

        if room.bot:
            self.export_bot(room.bot)

        if room.persona:
            self.export_persona(room.persona)

        if room.prompt:
            self.export_prompt(room.prompt)

        if room.summary_prompt:
            self.export_prompt(room.summary_prompt)

        if room.re_summary_prompt:
            self.export_prompt(room.re_summary_prompt)

        if room.translate_prompt:
            self.export_prompt(room.translate_prompt)

        for conversation in self.session.exec(select(Conversation).where(Conversation.room_id == room.id)):
            self.export_conversation(conversation)

        for summary in self.session.exec(select(Summary).where(Summary.room_id == room.id)):
            self.export_summary(summary)

    def export_bot(self, bot: Bot):
        if bot.id in self.exported_bots:
            return

        self.mkdir_exists_ok('bots')
        self.file.writestr(f"bots/{bot.id}.json", bot.model_dump_json())
        self.exported_bots[bot.id] = True
        if bot.profileImageId:
            self.export_image(bot.profileImageId)

        if bot.image_assets:
            image_assets = json.loads(bot.image_assets)
            for image_asset in image_assets:
                self.export_image(image_asset['imageId'])

    def export_persona(self, persona: Persona):
        if persona.id in self.exported_personas:
            return

        self.mkdir_exists_ok('personas')
        self.file.writestr(f"personas/{persona.id}.json", persona.model_dump_json())
        if persona.profileImageId:
            self.export_image(persona.profileImageId)

        self.exported_personas[persona.id] = True

    def export_prompt(self, prompt: Prompt):
        if prompt.id in self.exported_prompts:
            return

        self.mkdir_exists_ok('prompts')

        if prompt.llm_config:
            llm_config = json.loads(prompt.llm_config)
            if 'key' in llm_config:
                del llm_config['key']
            prompt.llm_config = json.dumps(llm_config)

        self.file.writestr(f"prompts/{prompt.id}.json", prompt.model_dump_json())
        self.exported_prompts[prompt.id] = True

    def export_image(self, image_id: str):
        if image_id in self.exported_images:
            return
        try:
            image, path = get_image_and_file_path_or_404(self.session, self.username, image_id)
            self.mkdir_exists_ok('images')
            self.file.writestr(f"images/{image_id}.json", image.model_dump_json())
            self.file.write(path, f"images/{image_id}.bin")
            self.exported_images[image_id] = True
        except:
            pass

    def export_conversation(self, conversation: Conversation):
        if conversation.id in self.exported_conversations:
            return

        self.mkdir_exists_ok('conversations')
        self.file.writestr(f"conversations/{conversation.id}.json", conversation.model_dump_json())
        self.exported_conversations[conversation.id] = True

    def export_summary(self, summary: Summary):
        if summary.id in self.exported_summaries:
            return

        self.mkdir_exists_ok('summaries')
        self.file.writestr(f"summaries/{summary.id}.json", summary.model_dump_json())
        self.exported_summaries[summary.id] = True
