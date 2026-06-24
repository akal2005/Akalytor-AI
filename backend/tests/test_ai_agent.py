import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

@pytest.mark.asyncio
async def test_ai_websocket_authentication_failure():
    from main import app
    client = TestClient(app)
    
    # Try connecting with invalid token
    with client.websocket_connect("/api/v1/ai/ws/chat?token=invalid_token") as websocket:
        data = websocket.receive_text()
        assert data == "Authentication failed. Invalid token."

def test_ai_agent_command_interception(client: TestClient, auth_headers, test_user_token):
    # This tests that if the AI spits out the CMD_ADD_TASK, it executes
    # We will mock the gemini stream to output the command
    with patch("routers.ai.model") as mock_model:
        mock_response = MagicMock()
        mock_chunk1 = MagicMock()
        mock_chunk1.text = "I will schedule this for you."
        mock_chunk2 = MagicMock()
        mock_chunk2.text = "||CMD_ADD_TASK: {\"task_name\": \"Moni AI Testing\", \"project_name\": \"QA\", \"deadline\": \"2026-12-31 10:00:00\"}||"
        mock_response.__iter__.return_value = [mock_chunk1, mock_chunk2]
        mock_model.generate_content.return_value = mock_response

        with client.websocket_connect(f"/api/v1/ai/ws/chat?token={test_user_token}") as websocket:
            websocket.send_text("Add a task to test Moni AI")
            
            response1 = websocket.receive_text()
            assert response1 == "I will schedule this for you."
            
            response2 = websocket.receive_text()
            assert "✅ *Action Executed" in response2
            
            response3 = websocket.receive_text()
            assert response3 == "[DONE]"
