import os

routers_dir = "routers"
files_to_patch = ["expenses.py", "savings.py", "calendar.py", "reminders.py", "goals.py", "study.py", "notes.py"]

for file_name in files_to_patch:
    file_path = os.path.join(routers_dir, file_name)
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, "r") as f:
        content = f.read()
        
    # Replace the MOCK_USER_ID variable and import Depends
    if "MOCK_USER_ID" in content:
        # Add get_current_user import
        if "from routers.auth import get_current_user" not in content:
            content = content.replace("from database import get_db", "from database import get_db\nfrom routers.auth import get_current_user")
            
        content = content.replace('MOCK_USER_ID = "00000000-0000-0000-0000-000000000000"\n', "")
        
        # Replace the function signatures and user_id assignment
        # This is a bit tricky with regex, let's do simple string replacements
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            if "def " in line and "db: Session = Depends(get_db)" in line:
                if "user: models.User = Depends(get_current_user)" not in line:
                    line = line.replace("db: Session = Depends(get_db)", "db: Session = Depends(get_db), user: models.User = Depends(get_current_user)")
            
            # Replace user_id=MOCK_USER_ID with user_id=user.id
            line = line.replace("user_id=MOCK_USER_ID", "user_id=user.id")
            line = line.replace("user_id == MOCK_USER_ID", "user_id == user.id")
            
            new_lines.append(line)
            
        with open(file_path, "w") as f:
            f.write('\n'.join(new_lines))
        print(f"Patched {file_name}")
