.PHONY: init vpn k3s

init:
	poetry run ansible-playbook playbooks/init.yml

vpn:
	poetry run ansible-playbook playbooks/init.yml

k3s:
	poetry run ansible-playbook k3s.orchestration.site
