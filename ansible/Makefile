.PHONY: init vpn k3s k3s-upgrade

init:
	poetry run ansible-playbook playbooks/warm_secrets.yml playbooks/init.yml

vpn:
	poetry run ansible-playbook playbooks/warm_secrets.yml playbooks/vpn.yml

k3s:
	poetry run ansible-playbook playbooks/warm_secrets.yml k3s.orchestration.site

# Use this (not `k3s`/site.yml) to bump k3s_version on an existing cluster.
# k3s.orchestration.upgrade upgrades server nodes with serial: 1 to avoid
# etcd learner/quorum issues; site.yml's server play has no such guard.
k3s-upgrade:
	poetry run ansible-playbook playbooks/warm_secrets.yml k3s.orchestration.upgrade
