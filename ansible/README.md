# Ansible Infrastructure Management

This Ansible project is used to manage and automate the configuration of:
- NAS server
- VPS instances

## Project Structure

```
ansible/
├── inventory/                 # Inventory files for different environments
│   ├── hosts                 # Main inventory file
│   ├── group_vars/          # Group variables
│   └── host_vars/           # Host-specific variables
├── roles/                    # Reusable roles
│   ├── common/              # Common configurations for all servers
│   ├── nas/                 # NAS-specific configurations
│   └── vps/                 # VPS-specific configurations
├── playbooks/               # Playbook files
│   ├── site.yml            # Main playbook
│   ├── nas.yml             # NAS-specific playbook
│   └── vps.yml             # VPS-specific playbook
├── files/                   # Static files to be copied
├── templates/               # Jinja2 templates
└── ansible.cfg              # Ansible configuration file
```


## Usage

1. Update inventory files with your server details
2. Run playbooks:
   ```bash
   # For all servers
   ansible-playbook -i inventory/hosts playbooks/site.yml

   # For NAS only
   ansible-playbook -i inventory/hosts playbooks/nas.yml

   # For VPSes only
   ansible-playbook -i inventory/hosts playbooks/vps.yml
   ```

## Requirements

- Ansible 2.9 or higher
- Python 3.6 or higher
- SSH access to target servers
- Sudo privileges on target servers
