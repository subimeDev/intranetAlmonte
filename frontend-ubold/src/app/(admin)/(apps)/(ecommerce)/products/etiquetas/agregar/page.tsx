import { Container } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import AddEtiquetaForm from '../components/AddEtiquetaForm'

export default function Page() {
  return (
    <Container fluid>
      <PageBreadcrumb title="Agregar Etiqueta" subtitle="Ecommerce" />
      <AddEtiquetaForm />
    </Container>
  )
}

