from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        load_dotenv()
        self.mongodb_url = os.getenv("MONGODB_URL")
        self.client = None
        self.db = None

    async def startup(self):
        try:
            self.client = AsyncIOMotorClient(self.mongodb_url)
            self.db = self.client["satscore"]
            logger.info("MongoDB connection established to satscore database")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise

    async def shutdown(self):
        try:
            if self.client:
                self.client.close()
                logger.info("MongoDB connection closed")
        except Exception as e:
            logger.error(f"Failed to close MongoDB connection: {str(e)}")
            raise

    def get_collection(self, collection_name: str):
        return self.db[collection_name]