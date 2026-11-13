import { useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { HTTPError } from 'ky';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Badge, Separator } from '@clickhouse/click-ui';
import {
  Box,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLock, IconUserPlus } from '@tabler/icons-react';

import api from '@/api';
import { useBrandDisplayName } from '@/brand';

export default function TeamMembersSection() {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const brandName = useBrandDisplayName();
  const hasAdminAccess = true;

  const {
    data: members,
    isLoading: isLoadingMembers,
    refetch: refetchMembers,
  } = api.useTeamMembers();

  const {
    data: invitations,
    isLoading: isLoadingInvitations,
    refetch: refetchInvitations,
  } = api.useTeamInvitations();

  const onSubmitTeamInviteForm = ({ email }: { email: string }) => {
    sendTeamInviteAction(email);
    setTeamInviteModalShow(false);
  };

  const [
    deleteTeamMemberConfirmationModalData,
    setDeleteTeamMemberConfirmationModalData,
  ] = useState<{
    mode: 'team' | 'teamInvite' | null;
    id: string | null;
    email: string | null;
  }>({
    mode: null,
    id: null,
    email: null,
  });
  const [teamInviteModalShow, setTeamInviteModalShow] = useState(false);

  const saveTeamInvitation = api.useSaveTeamInvitation();
  const deleteTeamMember = api.useDeleteTeamMember();
  const deleteTeamInvitation = api.useDeleteTeamInvitation();

  const sendTeamInviteAction = (email: string) => {
    if (email) {
      saveTeamInvitation.mutate(
        { email },
        {
          onSuccess: () => {
            notifications.show({
              color: 'green',
              message: t('teamMembers.inviteCreated'),
            });
            refetchInvitations();
          },
          onError: e => {
            if (e instanceof HTTPError) {
              e.response
                .json()
                .then(res => {
                  notifications.show({
                    color: 'red',
                    message: res.message,
                    autoClose: 5000,
                  });
                })
                .catch(() => {
                  notifications.show({
                    color: 'red',
                    message: t('teamMembers.contactSupport', { brandName }),

                    autoClose: 5000,
                  });
                });
            } else {
              notifications.show({
                color: 'red',
                message: t('teamMembers.contactSupport', { brandName }),
                autoClose: 5000,
              });
            }
          },
        },
      );
    }
  };

  const onConfirmDeleteTeamMember = (id: string) => {
    if (deleteTeamMemberConfirmationModalData.mode === 'team') {
      deleteTeamMemberAction(id);
    } else if (deleteTeamMemberConfirmationModalData.mode === 'teamInvite') {
      deleteTeamInviteAction(id);
    }
    setDeleteTeamMemberConfirmationModalData({
      mode: null,
      id: null,
      email: null,
    });
  };

  const deleteTeamInviteAction = (id: string) => {
    if (id) {
      deleteTeamInvitation.mutate(
        { id: encodeURIComponent(id) },
        {
          onSuccess: () => {
            notifications.show({
              color: 'green',
              message: t('teamMembers.inviteDeleted'),
            });
            refetchInvitations();
          },
          onError: e => {
            if (e instanceof HTTPError) {
              // The delete is team-scoped, so an invite that is already gone
              // comes back 404 with no body. From the user's side that is a
              // no-op, not something worth the contact-support message.
              if (e.response.status === 404) {
                notifications.show({
                  color: 'yellow',
                  message: t('teamMembers.inviteAlreadyRemoved'),
                  autoClose: 5000,
                });
                refetchInvitations();
                return;
              }
              e.response
                .json()
                .then(res => {
                  notifications.show({
                    color: 'red',
                    message: res.message,
                    autoClose: 5000,
                  });
                })
                .catch(() => {
                  notifications.show({
                    color: 'red',
                    message: t('teamMembers.contactSupport', { brandName }),

                    autoClose: 5000,
                  });
                });
            } else {
              notifications.show({
                color: 'red',
                message: t('teamMembers.contactSupport', { brandName }),
                autoClose: 5000,
              });
            }
          },
        },
      );
    }
  };
  const deleteTeamMemberAction = (id: string) => {
    if (id) {
      deleteTeamMember.mutate(
        { userId: encodeURIComponent(id) },
        {
          onSuccess: () => {
            notifications.show({
              color: 'green',
              message: t('teamMembers.memberDeleted'),
            });
            refetchMembers();
          },
          onError: e => {
            if (e instanceof HTTPError) {
              e.response
                .json()
                .then(res => {
                  notifications.show({
                    color: 'red',
                    message: res.message,
                    autoClose: 5000,
                  });
                })
                .catch(() => {
                  notifications.show({
                    color: 'red',
                    message: t('teamMembers.contactSupport', { brandName }),
                    autoClose: 5000,
                  });
                });
            } else {
              notifications.show({
                color: 'red',
                message: t('teamMembers.contactSupport', { brandName }),
                autoClose: 5000,
              });
            }
          },
        },
      );
    }
  };

  return (
    <Box id="team_members" data-testid="team-members-section">
      <Text size="md">{t('teamMembers.title')}</Text>
      <Separator size="lg" />
      <Card>
        <Card.Section withBorder py="sm" px="lg">
          <Group align="center" justify="space-between">
            <div className="fs-7">{t('teamMembers.title')}</div>
            <Button
              data-testid="invite-member-button"
              variant="primary"
              leftSection={<IconUserPlus size={16} />}
              onClick={() => setTeamInviteModalShow(true)}
            >
              {t('teamMembers.invite')}
            </Button>
          </Group>
        </Card.Section>
        <Card.Section>
          <Table horizontalSpacing="lg" verticalSpacing="xs">
            <Table.Tbody>
              {!isLoadingMembers &&
                Array.isArray(members?.data) &&
                members?.data.map(member => (
                  <Table.Tr key={member.email}>
                    <Table.Td>
                      <div>
                        {member.isCurrentUser && (
                          <Badge
                            size="sm"
                            text={t('teamMembers.you')}
                            state="info"
                            style={{
                              marginRight: 'var(--mantine-spacing-xs)',
                            }}
                          />
                        )}
                        <span className="text-white fw-bold fs-7">
                          {member.name}
                        </span>
                      </div>
                      <Group mt={4} fz="xs">
                        <div>{member.email}</div>
                        {member.hasPasswordAuth && (
                          <div>
                            <IconLock size={14} />{' '}
                            {t('teamMembers.passwordAuth')}
                          </div>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      {member.groupName && (
                        <Badge
                          size="sm"
                          text={member.groupName}
                          state="success"
                        />
                      )}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      {!member.isCurrentUser && hasAdminAccess && (
                        <Group justify="flex-end" gap="8">
                          <Button
                            size="compact-sm"
                            variant="danger"
                            onClick={() =>
                              setDeleteTeamMemberConfirmationModalData({
                                mode: 'team',
                                id: member._id,
                                email: member.email,
                              })
                            }
                          >
                            {t('teamMembers.remove')}
                          </Button>
                        </Group>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              {!isLoadingInvitations &&
                Array.isArray(invitations?.data) &&
                invitations.data.map(invitation => (
                  <Table.Tr key={invitation.email} className="mt-2">
                    <Table.Td>
                      <span className="text-white fw-bold fs-7">
                        {invitation.email}
                      </span>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        text={t('teamMembers.pendingInvite')}
                        state="neutral"
                        icon="dot"
                        iconDir="start"
                      />
                      <CopyToClipboard text={invitation.url}>
                        <Button size="compact-xs" variant="secondary" ml="xs">
                          📋 {t('teamMembers.copyUrl')}
                        </Button>
                      </CopyToClipboard>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      {hasAdminAccess && (
                        <Group justify="flex-end" gap="8">
                          <Button
                            size="compact-sm"
                            variant="danger"
                            onClick={() =>
                              setDeleteTeamMemberConfirmationModalData({
                                mode: 'teamInvite',
                                id: invitation._id,
                                email: invitation.email,
                              })
                            }
                          >
                            {t('teamMembers.delete')}
                          </Button>
                        </Group>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
        </Card.Section>
      </Card>

      <Modal
        centered
        onClose={() => setTeamInviteModalShow(false)}
        opened={teamInviteModalShow}
        title={t('teamMembers.invite')}
      >
        <InviteTeamMemberForm
          onSubmit={onSubmitTeamInviteForm}
          isSubmitting={saveTeamInvitation.isPending}
        />
      </Modal>

      <Modal
        centered
        onClose={() =>
          setDeleteTeamMemberConfirmationModalData({
            mode: null,
            id: null,
            email: null,
          })
        }
        opened={deleteTeamMemberConfirmationModalData.id != null}
        size="lg"
        title={t('teamMembers.deleteTitle')}
      >
        <Stack>
          <Text>
            {t('teamMembers.deleteConfirm', {
              email: deleteTeamMemberConfirmationModalData.email,
            })}
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button
              data-testid="cancel-delete-member"
              variant="secondary"
              onClick={() =>
                setDeleteTeamMemberConfirmationModalData({
                  mode: null,
                  id: null,
                  email: null,
                })
              }
            >
              {tCommon('actions.cancel')}
            </Button>
            <Button
              data-testid="confirm-delete-member"
              variant="danger"
              onClick={() =>
                deleteTeamMemberConfirmationModalData.id &&
                onConfirmDeleteTeamMember(
                  deleteTeamMemberConfirmationModalData.id,
                )
              }
            >
              {tCommon('actions.confirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}

function InviteTeamMemberForm({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting?: boolean;
  onSubmit: (arg0: { email: string }) => void;
}) {
  const { t } = useTranslation('settings');
  const [email, setEmail] = useState<string>('');

  return (
    <form
      onSubmit={e => {
        onSubmit({ email });
        e.preventDefault();
      }}
    >
      <Stack>
        <TextInput
          data-testid="invite-email-input"
          label={t('teamMembers.email')}
          name="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder={t('teamMembers.emailPlaceholder')}
          withAsterisk={false}
        />
        <div className="fs-8">{t('teamMembers.inviteExpiry')}</div>
        <Button
          data-testid="send-invite-button"
          variant="primary"
          type="submit"
          disabled={!email || isSubmitting}
        >
          {t('teamMembers.sendInvite')}
        </Button>
      </Stack>
    </form>
  );
}
