from sentry.models import (
    Identity,
    IdentityProvider,
    Integration,
    OrganizationIntegration,
    Repository,
)
from sentry.testutils import APITestCase
from sentry.testutils.helpers import with_feature


class OrganizationIntegrationDetailsTest(APITestCase):
    endpoint = "sentry-api-0-organization-integration-details"

    def setUp(self):
        super().setUp()

        self.login_as(user=self.user)
        self.integration = Integration.objects.create(
            provider="gitlab", name="Gitlab", external_id="gitlab:1"
        )
        self.identity = Identity.objects.create(
            idp=IdentityProvider.objects.create(type="gitlab", config={}, external_id="gitlab:1"),
            user=self.user,
            external_id="base_id",
            data={},
        )
        self.integration.add_organization(
            self.organization, self.user, default_auth_id=self.identity.id
        )

        self.repo = Repository.objects.create(
            provider="gitlab",
            name="getsentry/sentry",
            organization_id=self.organization.id,
            integration_id=self.integration.id,
        )


class OrganizationIntegrationDetailsGetTest(OrganizationIntegrationDetailsTest):
    def test_simple(self):
        response = self.get_success_response(self.organization.slug, self.integration.id)
        assert response.data["id"] == str(self.integration.id)


class OrganizationIntegrationDetailsPostTest(OrganizationIntegrationDetailsTest):
    method = "post"

    def test_update_config(self):
        config = {"setting": "new_value", "setting2": "baz"}
        self.get_success_response(self.organization.slug, self.integration.id, **config)

        org_integration = OrganizationIntegration.objects.get(
            integration=self.integration, organization=self.organization
        )

        assert org_integration.config == config


class OrganizationIntegrationDetailsDeleteTest(OrganizationIntegrationDetailsTest):
    method = "delete"

    def test_removal(self):
        with self.tasks():
            self.get_success_response(self.organization.slug, self.integration.id)
            assert Integration.objects.filter(id=self.integration.id).exists()

            # Ensure Organization integrations are removed
            assert not OrganizationIntegration.objects.filter(
                integration=self.integration, organization=self.organization
            ).exists()
            assert not Identity.objects.filter(user=self.user).exists()

            # make sure repo is dissociated from integration
            assert Repository.objects.get(id=self.repo.id).integration_id is None

    def test_removal_default_identity_already_removed(self):
        with self.tasks():
            self.identity.delete()
            self.get_success_response(self.organization.slug, self.integration.id)

            assert Integration.objects.filter(id=self.integration.id).exists()

            # Ensure Organization integrations are removed
            assert not OrganizationIntegration.objects.filter(
                integration=self.integration, organization=self.organization
            ).exists()


class OrganizationIntegrationDetailsPutTest(OrganizationIntegrationDetailsTest):
    method = "put"

    def test_no_access_put_request(self):
        self.get_error_response(
            self.organization.slug, self.integration.id, **{"name": "Example Name"}, status_code=404
        )

    @with_feature("organizations:integrations-custom-scm")
    def test_valid_put_request(self):
        integration = Integration.objects.create(
            provider="custom_scm", name="A Name", external_id="1232948573948579127"
        )
        integration.add_organization(self.organization, self.user)

        self.get_success_response(
            self.organization.slug,
            integration.id,
            **{"name": "New Name", "domain": "https://example.com/"},
        )

        updated = Integration.objects.get(id=integration.id)
        assert updated.name == "New Name"
        assert updated.metadata["domain_name"] == "https://example.com/"

    @with_feature("organizations:integrations-custom-scm")
    def test_partial_updates(self):
        integration = Integration.objects.create(
            provider="custom_scm", name="A Name", external_id="1232948573948579127"
        )
        integration.add_organization(self.organization, self.user)

        self.get_success_response(
            self.organization.slug, integration.id, **{"domain": "https://example.com/"}
        )

        updated = Integration.objects.get(id=integration.id)
        assert updated.name == "A Name"
        assert updated.metadata["domain_name"] == "https://example.com/"

        self.get_success_response(self.organization.slug, integration.id, **{"name": "Newness"})
        updated = Integration.objects.get(id=integration.id)
        assert updated.name == "Newness"
        assert updated.metadata["domain_name"] == "https://example.com/"

        self.get_success_response(self.organization.slug, integration.id, **{"domain": ""})
        updated = Integration.objects.get(id=integration.id)
        assert updated.name == "Newness"
        assert updated.metadata["domain_name"] == ""
